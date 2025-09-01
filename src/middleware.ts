import { NextResponse } from 'next/server';

import {
  clerkMiddleware,
  type ClerkMiddlewareOptions,
  createRouteMatcher,
} from '@clerk/nextjs/server';

// Protected route matchers with documentation
const routeMatchers = {
  admin: createRouteMatcher(['/dashboard/admin(.*)']) as (
    req: Request
  ) => boolean,
  superAdmin: createRouteMatcher(['/dashboard/super-admin(.*)']) as (
    req: Request
  ) => boolean,
  educador: createRouteMatcher(['/dashboard/educadores(.*)']) as (
    req: Request
  ) => boolean,
  protectedStudent: createRouteMatcher(['/estudiantes/clases/:id']) as (
    req: Request
  ) => boolean,
  publicRoutes: createRouteMatcher(['/cursos/:id*', '/programas/:id*']) as (
    req: Request
  ) => boolean,
  protected: createRouteMatcher(['/dashboard(.*)']) as (
    req: Request
  ) => boolean,
};

const PUBLIC_WEBHOOK_ROUTES = [
  '/api/super-admin/whatsapp/webhook',
  '/api/super-admin/whatsapp/health',
  '/api/super-admin/whatsapp/inbox',
];

const middlewareConfig: ClerkMiddlewareOptions = {
  authorizedParties: [
    'https://artiefy.com',
    'https://accounts.artiefy.com',
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000']
      : []),
  ],
  clockSkewInMs: 60 * 1000, // 60 seconds tolerance
};

const isWhatsAppWebhook = createRouteMatcher([
  '/api/super-admin/whatsapp/webhook',
  '/api/super-admin/whatsapp/health',
  '/api/super-admin/whatsapp/inbox',
]) as (req: Request) => boolean;

export default clerkMiddleware(async (auth, req) => {
  try {
    if (isWhatsAppWebhook(req)) {
      return NextResponse.next();
    }
    const { userId, sessionClaims } = await auth();
    const role = sessionClaims?.metadata?.role;

    // Allow public access to course and program routes
    if (routeMatchers.publicRoutes(req)) {
      return NextResponse.next();
    }

    // Prevent admin and educador from accessing student routes (but allow super-admin)
    if (
      req.url.includes('/estudiantes') &&
      ['admin', 'educador'].includes(role as string)
    ) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Check protected student routes (classes, programs, courses with ID)
    if (routeMatchers.protectedStudent(req)) {
      if (!userId) {
        return NextResponse.redirect(
          new URL(
            `/sign-in?redirect_url=${encodeURIComponent(req.url)}`,
            req.url
          )
        );
      }
    }

    // Handle other protected routes (admin, super-admin, educador)
    if (routeMatchers.admin(req) && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (routeMatchers.superAdmin(req) && role !== 'super-admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (routeMatchers.educador(req) && role !== 'educador') {
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
    // Mantienes tu primer patrón, pero ahora excluye también las rutas del webhook:
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/super-admin/whatsapp/(webhook|health|inbox)).*)',

    // Mantienes tu segundo patrón /api|trpc, pero excluye explícitamente las rutas de WhatsApp:
    '/(api|trpc)(?!/super-admin/whatsapp/(webhook|health|inbox)).*',
  ],
};
