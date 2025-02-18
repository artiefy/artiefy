import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/dashboard/super-admin(.*)']);
const isEducatorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isStudentClassRoute = createRouteMatcher(['/estudiantes/clases/:id']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)']);
const publicRoutes = createRouteMatcher(['/sign-in', '/sign-up']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;

  // Log for debugging
  console.log('Request URL:', req.url);
  console.log('Next URL:', req.nextUrl);

  // Redirect to sign-in page if not authenticated and the route is protected
  if (!userId && isProtectedRoute(req)) {
    const redirectTo = req.nextUrl.href;
    const signInUrl = new URL('/sign-in', req.nextUrl.origin);
    signInUrl.searchParams.set('redirect_url', redirectTo);
    return NextResponse.redirect(signInUrl);
  }

  // Protect specific routes by role
  if (isAdminRoute(req) && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isSuperAdminRoute(req) && role !== 'super-admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isEducatorRoute(req) && role !== 'educador') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Protect dynamic student routes
  if (isStudentClassRoute(req) && !userId) {
    const redirectTo = req.nextUrl.href;
    const signInUrl = new URL('/sign-in', req.nextUrl.origin);
    signInUrl.searchParams.set('redirect_url', redirectTo);
    return NextResponse.redirect(signInUrl);
  }

  // Handle public routes
  if (!userId && publicRoutes(req)) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Omit Next.js internals and all static files, unless found in search parameters
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
