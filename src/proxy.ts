import { NextResponse } from 'next/server';

import {
  clerkMiddleware,
  type ClerkMiddlewareOptions,
} from '@clerk/nextjs/server';

import { slugAcademiaDesdeHost, urlAcademia } from '~/lib/academy/host';
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
  return (
    pathname.startsWith('/dashboard/subscription') ||
    // El super-admin puede entrar al panel de educadores para ver lo que ve
    // un educador. Sin esto, el redirect por rol lo devolvia a su dashboard.
    pathname.startsWith('/dashboard/educadores') ||
    // Finanzas › Historial de Transacciones (su API exige admin/super-admin).
    pathname.startsWith('/dashboard/transaction-history')
  );
}

function isEducadorPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/educadores');
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

// Rutas del front de estudiantes que un super-admin SÍ puede ver: todo el front
// de estudiantes (listados, detalle de cursos/programas/clases, perfil, cuenta,
// etc.) más el catálogo público de proyectos. El super-admin navega como si
// fuera un estudiante más, sin que el redirect por rol lo devuelva a su
// dashboard.
function isSuperAdminStudentPath(pathname: string): boolean {
  return (
    pathname === '/estudiantes' ||
    pathname.startsWith('/estudiantes/') ||
    pathname === '/proyectos' ||
    pathname.startsWith('/proyectos/') ||
    pathname === '/explorar'
  );
}

function isLegacyEducadorPath(pathname: string): boolean {
  return (
    pathname === '/dashboard/educador' ||
    pathname.startsWith('/dashboard/educador/')
  );
}

/**
 * Archivos servidos desde /public que el middleware NO debe tocar.
 *
 * El matcher excluye css, js e imágenes, pero deja pasar `.json` y `.bin`. Sin
 * esta salida, la petición de un usuario con rol privilegiado acaba en el
 * redirect al dashboard, y quien pedía JSON recibe una página HTML. Es lo que
 * rompía la carga de los modelos de reconocimiento facial.
 */
function isPublicAssetPath(pathname: string): boolean {
  return pathname.startsWith('/models/');
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
    pathname === '/explorar' ||
    pathname === '/comunidad' ||
    pathname === '/planes' ||
    pathname.startsWith('/agradecimiento-curso/') ||
    pathname.startsWith('/agradecimiento-proyecto/') ||
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
  // El webhook de Clerk se autentica con su propia firma (svix), no con sesión.
  return pathname === '/api/image-proxy' || pathname === '/api/webhooks/clerk';
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api') || pathname.startsWith('/trpc');
}

// Rutas de contenido con [id] que requieren suscripción activa.
//
// Solo el contenido que se CONSUME queda cerrado aquí (las clases). Las páginas
// de DETALLE —curso, programa, proyecto guiado— quedan abiertas: un estudiante
// con la suscripción vencida puede verlas, y es el botón de inscripción el que
// lo envía a /planes (los cursos gratis no lo hacen). El detalle de las
// actividades de un proyecto guiado se valida server-side en su propia página.
function isSubscriptionGatedPath(pathname: string): boolean {
  return /^\/estudiantes\/clases\/[^/]+/.test(pathname);
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

// Academias (<slug>.artiefy.com): cada subdominio es una "copia" de Artiefy
// con sus propias cuentas. Sus páginas viven en src/app/academia/[slug]/ y se
// llega a ellas reescribiendo la ruta; no pasan por la lógica de roles de
// Artiefy (el rol de cada cuenta está en academy_users y lo valida cada página).
function manejarAcademia(
  slug: string,
  req: Request,
  pathname: string,
  userId: string | null
) {
  // El matcher omite los assets estáticos; interceptar este path explícito
  // permite que el favicon genérico del navegador también sea el de la academia.
  if (pathname === '/favicon.ico') {
    return NextResponse.rewrite(
      new URL(`/api/academia/${slug}/favicon`, req.url)
    );
  }

  // Las APIs se autentican y autorizan solas.
  if (isApiPath(pathname)) return NextResponse.next();

  const url = new URL(req.url);
  // El formulario de inscripción (/dashboard/formulario) es público, como en
  // Artiefy.
  if (
    pathname.startsWith('/dashboard') &&
    !userId &&
    !isPublicDashboardPath(pathname)
  ) {
    const signIn = new URL('/sign-in', req.url);
    signIn.searchParams.set('redirect_url', url.pathname + url.search);
    return NextResponse.redirect(signIn);
  }

  const destino = new URL(`/academia/${slug}${pathname}`, req.url);
  destino.search = url.search;
  return NextResponse.rewrite(destino);
}

const whatsAppWebhookPaths = new Set([
  '/api/super-admin/whatsapp/webhook',
  '/api/super-admin/whatsapp/health',
  '/api/super-admin/whatsapp/inbox',
]);

export default clerkMiddleware(
  async (auth, req) => {
    try {
      const pathname = getPathname(req);

      // Webhooks y APIs públicas: nunca tocan auth ni redirecciones.
      if (whatsAppWebhookPaths.has(pathname) || isPublicApiPath(pathname)) {
        return NextResponse.next();
      }

      // Archivos estáticos de /public: se sirven tal cual, sin redirecciones.
      if (isPublicAssetPath(pathname)) {
        return NextResponse.next();
      }

      const { userId, sessionClaims } = await auth();
      const metadata = sessionClaims?.metadata;

      // Subdominio de una academia: flujo propio, sin la lógica de Artiefy.
      const slugAcademia = slugAcademiaDesdeHost(req.headers.get('host'));
      if (slugAcademia) {
        return manejarAcademia(slugAcademia, req, pathname, userId);
      }

      // En Artiefy, /academia/<slug>/... solo existe como destino interno de la
      // reescritura: se manda al subdominio real.
      const rutaInterna = /^\/academia\/([^/]+)(\/.*)?$/.exec(pathname);
      if (rutaInterna?.[1]) {
        return NextResponse.redirect(
          urlAcademia(rutaInterna[1], rutaInterna[2] ?? '/', req.url)
        );
      }

      // Una cuenta de academia no usa Artiefy: va a su academia. Requiere
      // academySlug en el session token (ver CustomJwtSessionClaims); si no
      // está configurado, no se redirige (fail-open) y cada página de Artiefy
      // sigue con sus propias validaciones. Las cuentas propias de una
      // academia no tienen `role` de Artiefy: si lo tiene, es una cuenta de
      // Artiefy vinculada y se queda aquí aunque arrastre un academySlug.
      if (
        userId &&
        metadata?.academySlug &&
        !metadata.role &&
        !isApiPath(pathname) &&
        !pathname.startsWith('/sign-in') &&
        !pathname.startsWith('/sign-up')
      ) {
        return NextResponse.redirect(
          urlAcademia(metadata.academySlug, '/dashboard', req.url)
        );
      }

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
          // Las rutas públicas del dashboard (el formulario de inscripción) no
          // son de nadie: se comprueban más abajo, pero el redirect por rol se
          // ejecuta antes y expulsaba de ahí a educadores y administradores.
          isPublicDashboardPath(pathname) ||
          (role === 'super-admin' && isSuperAdminSharedDashboardPath(pathname));
        const isAuthRoute =
          pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

        // Excepciones al redirect por rol hacia el dashboard:
        //  - super-admin: solo el DETALLE de cursos y programas (y clases). Los
        //    listados y el resto del front de estudiantes lo devuelven a su
        //    dashboard.
        //  - educador: puede ver las rutas [id] de cursos/clases que tenga
        //    asignados (la propiedad del curso se valida en la página server-side).
        const canBrowseStudents =
          (role === 'super-admin' && isSuperAdminStudentPath(pathname)) ||
          (role === 'educador' && isEducadorStudentPath(pathname));

        if (!isInOwnDashboard && !isAuthRoute && !canBrowseStudents) {
          return NextResponse.redirect(new URL(dashboardRoute, req.url));
        }
      }

      // 2) Gating de suscripción: un estudiante autenticado con la suscripción
      //    vencida/inactiva no puede ver las clases; se le envía a /planes. El
      //    detalle de cursos, programas y proyectos guiados sigue siendo visible
      //    para que pueda explorar el catálogo y comprar desde ahí. Los visitantes
      //    anónimos siguen pudiendo ver las páginas públicas.
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

      if (
        isEducadorPath(pathname) &&
        role !== 'educador' &&
        role !== 'super-admin'
      ) {
        return NextResponse.redirect(new URL('/', req.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/error', req.url));
    }
    // En el subdominio de una academia, su propio origen también es un
    // "authorized party" de Clerk (no se puede listar cada academia a mano).
  },
  (req) => {
    const host = req.headers.get('host');
    if (!host || !slugAcademiaDesdeHost(host)) return middlewareConfig;
    // El origen sale del header host: en desarrollo req.url llega normalizado
    // a localhost y Clerk rechazaba la sesión del subdominio (azp distinto).
    const protocolo =
      req.headers.get('x-forwarded-proto') ??
      req.nextUrl.protocol.replace(':', '');
    return {
      ...middlewareConfig,
      authorizedParties: [...authorizedParties, `${protocolo}://${host}`],
    };
  }
);

export const config = {
  matcher: [
    '/favicon.ico',
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
