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
    const redirectTo = encodeURIComponent(req.url + req.nextUrl.search);
    return NextResponse.redirect(`${req.nextUrl.origin}/sign-in?redirect_url=${redirectTo}`);
  }

  // Protect specific routes by role
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
    const redirectTo = encodeURIComponent(req.url + req.nextUrl.search);
    return NextResponse.redirect(`${req.nextUrl.origin}/sign-in?redirect_url=${redirectTo}`);
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
