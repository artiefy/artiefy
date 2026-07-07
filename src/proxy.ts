import { NextResponse } from 'next/server';

import {
  clerkMiddleware,
  type ClerkMiddlewareOptions,
} from '@clerk/nextjs/server';

import {
  getDashboardRouteByRole,
  getUserRole,
  STUDENT_ROLE,
} from '~/utils/roles';

function getPathname(req: Request): string {
  return new URL(req.url).pathname;
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/admin');
}

function isSuperAdminPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/super-admin');
}

function isSuperAdminSharedDashboardPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/subscription');
}

function isEducadorPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/educadores');
}

// Cualquier ruta del front de estudiantes. Un super-admin puede verlas todas.
function isStudentAppPath(pathname: string): boolean {
  return pathname === '/estudiantes' || pathname.startsWith('/estudiantes/');
}

// Rutas [id] de cursos/clases que un educador puede ver de SUS cursos. La
// propiedad real del curso se valida server-side en cada página; aquí solo se
// abre el acceso para que el redirect por rol no lo expulse a su dashboard.
function isEducadorStudentPath(pathname: string): boolean {
  return (
    /^\/estudiantes\/cursos\/[^/]+/.test(pathname) ||
    /^\/estudiantes\/clases\/[^/]+/.test(pathname)
  );
}

function isLegacyEducadorPath(pathname: string): boolean {
  return (
    pathname === '/dashboard/educador' ||
    pathname.startsWith('/dashboard/educador/')
  );
}

function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard');
}

function isPublicDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard/formulario';
}

function isPublicAppPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/estudiantes' ||
    pathname.startsWith('/estudiantes/cursos/') ||
    pathname.startsWith('/estudiantes/proyectos-guiados/') ||
    pathname.startsWith('/estudiantes/programas/') ||
    pathname === '/proyectos' ||
    pathname.startsWith('/proyectos/') ||
    pathname === '/comunidad' ||
    pathname === '/planes' ||
    pathname.startsWith('/agradecimiento-curso/') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname === '/error'
  );
}

function isProtectedStudentPath(pathname: string): boolean {
  return (
    /^\/estudiantes\/clases\/[^/]+\/?$/.test(pathname) ||
    pathname === '/estudiantes/myaccount' ||
    pathname.startsWith('/estudiantes/myaccount/')
  );
}

function isPublicContentPath(pathname: string): boolean {
  return /^\/(cursos|programas)(\/.*)?$/.test(pathname);
}

function isPublicApiPath(pathname: string): boolean {
  return pathname === '/api/image-proxy';
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api') || pathname.startsWith('/trpc');
}

// Rutas de contenido con [id] que requieren suscripción activa.
function isSubscriptionGatedPath(pathname: string): boolean {
  return (
    /^\/estudiantes\/cursos\/[^/]+/.test(pathname) ||
    /^\/estudiantes\/clases\/[^/]+/.test(pathname) ||
    /^\/estudiantes\/programas\/[^/]+/.test(pathname) ||
    /^\/estudiantes\/proyectos-guiados\/[^/]+/.test(pathname) ||
    /^\/(cursos|programas)\/[^/]+/.test(pathname)
  );
}

// Determina si la suscripción está vencida/inactiva a partir de los claims del
// JWT. NOTA: requiere que el session token de Clerk incluya estos campos del
// public_metadata. Si no están presentes, devuelve false (fail-open: no bloquea).
// Configuración del session token en Clerk (Dashboard → Sessions → Customize):
//   {
//     "metadata": {
//       "role": "{{user.public_metadata.role}}",
//       "subscriptionStatus": "{{user.public_metadata.subscriptionStatus}}",
//       "subscriptionEndDate": "{{user.public_metadata.subscriptionEndDate}}",
//       "planType": "{{user.public_metadata.planType}}"
//     }
//   }
function isSubscriptionExpired(
  metadata: CustomJwtSessionClaims['metadata'] | undefined
): boolean {
  const planType = metadata?.planType;
  // Solo los planes de pago requieren suscripción activa.
  const requiresActive =
    planType === 'Premium' || planType === 'Pro' || planType === 'Enterprise';
  if (!requiresActive) return false;

  const status = metadata?.subscriptionStatus;
  if (status && status !== 'active') return true;

  const endDate = metadata?.subscriptionEndDate;
  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime()) && end < new Date()) return true;
  }
  return false;
}

const envPartyCandidates = [
  process.env.NEXT_PUBLIC_BASE_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
];

const envAuthorizedParties = envPartyCandidates.flatMap((value) => {
  if (!value) return [];
  try {
    return [new URL(value).origin];
  } catch {
    return [];
  }
});

const authorizedParties = Array.from(
  new Set([
    'https://artiefy.com',
    'https://www.artiefy.com',
    'https://accounts.artiefy.com',
    ...envAuthorizedParties,
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000', 'http://127.0.0.1:3000']
      : []),
  ])
);

const middlewareConfig: ClerkMiddlewareOptions = {
  authorizedParties,
  clockSkewInMs: 60 * 1000, // 60 seconds tolerance
};

const whatsAppWebhookPaths = new Set([
  '/api/super-admin/whatsapp/webhook',
  '/api/super-admin/whatsapp/health',
  '/api/super-admin/whatsapp/inbox',
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const pathname = getPathname(req);

    // Webhooks y APIs públicas: nunca tocan auth ni redirecciones.
    if (whatsAppWebhookPaths.has(pathname) || isPublicApiPath(pathname)) {
      return NextResponse.next();
    }

    const { userId, sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata;
    const role = getUserRole(metadata?.role);

    // 1) Redirect por rol: un usuario con rol privilegiado (educador/admin/
    //    super-admin) siempre es llevado a SU dashboard, sea cual sea la ruta
    //    desde la que inicie sesión. Estudiantes y usuarios sin rol siguen en el
    //    front normal. No aplica a /api ni a las rutas de auth (para no romper
    //    llamadas ni el propio flujo de login/logout).
    if (userId && role && role !== STUDENT_ROLE && !isApiPath(pathname)) {
      const dashboardRoute = getDashboardRouteByRole(role);
      const isInOwnDashboard =
        pathname.startsWith(dashboardRoute) ||
        (role === 'super-admin' && isSuperAdminSharedDashboardPath(pathname));
      const isAuthRoute =
        pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

      // Excepciones al redirect por rol hacia el dashboard:
      //  - super-admin: puede navegar TODO el front de estudiantes.
      //  - educador: puede ver las rutas [id] de cursos/clases (la propiedad
      //    del curso se valida en la propia página server-side).
      const canBrowseStudents =
        (role === 'super-admin' && isStudentAppPath(pathname)) ||
        (role === 'educador' && isEducadorStudentPath(pathname));

      if (!isInOwnDashboard && !isAuthRoute && !canBrowseStudents) {
        return NextResponse.redirect(new URL(dashboardRoute, req.url));
      }
    }

    // 2) Gating de suscripción: un estudiante autenticado con la suscripción
    //    vencida/inactiva no puede ver contenido [id] (curso, clase, programa,
    //    proyecto guiado); se le envía a /planes. Los visitantes anónimos siguen
    //    pudiendo ver las páginas públicas para registrarse y comprar.
    if (
      userId &&
      (role === STUDENT_ROLE || !role) &&
      isSubscriptionGatedPath(pathname) &&
      isSubscriptionExpired(metadata)
    ) {
      return NextResponse.redirect(new URL('/planes', req.url));
    }

    if (isLegacyEducadorPath(pathname)) {
      return NextResponse.redirect(
        new URL(
          pathname.replace('/dashboard/educador', '/dashboard/educadores'),
          req.url
        )
      );
    }

    // Rutas públicas: dejar pasar (después de los checks de rol/suscripción).
    if (
      isPublicAppPath(pathname) ||
      isPublicContentPath(pathname) ||
      isPublicDashboardPath(pathname)
    ) {
      return NextResponse.next();
    }

    if (isProtectedStudentPath(pathname) || isDashboardPath(pathname)) {
      if (!userId) {
        return NextResponse.redirect(
          new URL(
            `/sign-in?redirect_url=${encodeURIComponent(req.url)}`,
            req.url
          )
        );
      }
    }

    if (isAdminPath(pathname) && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (isSuperAdminPath(pathname) && role !== 'super-admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (isEducadorPath(pathname) && role !== 'educador') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/error', req.url));
  }
}, middlewareConfig);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
