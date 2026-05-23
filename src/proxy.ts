import { NextResponse } from 'next/server';

import {
  clerkMiddleware,
  type ClerkMiddlewareOptions,
} from '@clerk/nextjs/server';

import { getPrivilegedDashboardRoute, getUserRole } from '~/utils/roles';

function getPathname(req: Request): string {
  return new URL(req.url).pathname;
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/admin');
}

function isSuperAdminPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/super-admin');
}

function isEducadorPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/educadores');
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

    if (pathname === '/') {
      try {
        const { userId, sessionClaims } = await auth();
        const role = getUserRole(sessionClaims?.metadata?.role);
        const privilegedDashboardRoute = getPrivilegedDashboardRoute(role);

        if (userId && privilegedDashboardRoute) {
          return NextResponse.redirect(
            new URL(privilegedDashboardRoute, req.url)
          );
        }
      } catch {
        return NextResponse.next();
      }

      return NextResponse.next();
    }

    if (
      whatsAppWebhookPaths.has(pathname) ||
      isPublicApiPath(pathname) ||
      isPublicAppPath(pathname) ||
      isPublicContentPath(pathname) ||
      isPublicDashboardPath(pathname)
    ) {
      return NextResponse.next();
    }

    if (isLegacyEducadorPath(pathname)) {
      return NextResponse.redirect(
        new URL(
          pathname.replace('/dashboard/educador', '/dashboard/educadores'),
          req.url
        )
      );
    }

    const { userId, sessionClaims } = await auth();
    const role = getUserRole(sessionClaims?.metadata?.role);

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
