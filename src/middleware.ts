import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/dashboard/super-admin(.*)']);
const isEducatorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isStudentClassRoute = createRouteMatcher(['/estudiantes/clases/:id']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;

  // Protect specific role routes
  if (isAdminRoute(req) && role !== 'admin') {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }

  if (isSuperAdminRoute(req) && role !== 'super-admin') {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }

  if (isEducatorRoute(req) && role !== 'educador') {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }

  // Protect dynamic student routes
  if (isStudentClassRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to login page if not authenticated and the route is protected
  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Handle OAuth redirections
  if (req.nextUrl.pathname === '/sso-callback') {
    const redirectUrl = req.nextUrl.searchParams.get('redirect_url');
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
