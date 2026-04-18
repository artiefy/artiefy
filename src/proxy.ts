import { NextResponse } from 'next/server';

import {
  clerkMiddleware,
  type ClerkMiddlewareOptions,
} from '@clerk/nextjs/server';

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

function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard');
}

function isProtectedStudentPath(pathname: string): boolean {
  return /^\/estudiantes\/clases\/[^/]+\/?$/.test(pathname);
}

function isPublicContentPath(pathname: string): boolean {
  return /^\/(cursos|programas)(\/.*)?$/.test(pathname);
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

    if (whatsAppWebhookPaths.has(pathname)) {
      return NextResponse.next();
    }

    const { userId, sessionClaims } = await auth();
    const role = sessionClaims?.metadata?.role;

    if (isPublicContentPath(pathname)) {
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
