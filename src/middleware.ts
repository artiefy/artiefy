import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/dashboard/super-admin(.*)']);
const isEducatorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isStudentClassRoute = createRouteMatcher(['/estudiantes/clases/:id']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)', '/planes(.*)']);
const publicRoutes = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role as string | undefined;

  // Allow public routes
  if (publicRoutes(req)) {
    return NextResponse.next();
  }

  // Redirect to login page if not authenticated and the route is protected
  if (!userId && isProtectedRoute(req)) {
    const returnUrl = req.nextUrl.pathname + req.nextUrl.search;
    const signInUrl = new URL('/sign-in', req.url);
    // Use searchParams instead of hash
    signInUrl.searchParams.set('redirect_url', returnUrl);
    return NextResponse.redirect(signInUrl);
  }

  // Protect specific role routes
  if (isAdminRoute(req) && role !== 'admin') {
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }

  if (isSuperAdminRoute(req) && role !== 'super-admin') {
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }

  if (isEducatorRoute(req) && role !== 'educador') {
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }

  // Protect dynamic student routes
  if (isStudentClassRoute(req) && !userId) {
    const returnUrl = req.nextUrl.pathname + req.nextUrl.search;
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', returnUrl);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
