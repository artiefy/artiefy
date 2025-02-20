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

  console.log('User ID:', userId);
  console.log('Role:', role);
  console.log('Request URL:', req.url);

  // Redirect to login page if not authenticated and the route is protected
  if (!userId && isProtectedRoute(req)) {
    const redirectTo = `${req.nextUrl.origin}${req.nextUrl.pathname}${req.nextUrl.search}`;
    console.log('Redirecting to sign-in:', `${req.nextUrl.origin}/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`);
    return NextResponse.redirect(`${req.nextUrl.origin}/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`);
  }

  // Protect specific role routes
  if (isAdminRoute(req) && role !== 'admin') {
    const redirectTo = `${req.nextUrl.origin}${req.nextUrl.pathname}${req.nextUrl.search}`;
    console.log('Redirecting to home (admin route):', `${req.nextUrl.origin}/?redirect_url=${encodeURIComponent(redirectTo)}`);
    return NextResponse.redirect(`${req.nextUrl.origin}/?redirect_url=${encodeURIComponent(redirectTo)}`);
  }

  if (isSuperAdminRoute(req) && role !== 'super-admin') {
    const redirectTo = `${req.nextUrl.origin}${req.nextUrl.pathname}${req.nextUrl.search}`;
    console.log('Redirecting to home (super-admin route):', `${req.nextUrl.origin}/?redirect_url=${encodeURIComponent(redirectTo)}`);
    return NextResponse.redirect(`${req.nextUrl.origin}/?redirect_url=${encodeURIComponent(redirectTo)}`);
  }

  if (isEducatorRoute(req) && role !== 'educador') {
    const redirectTo = `${req.nextUrl.origin}${req.nextUrl.pathname}${req.nextUrl.search}`;
    console.log('Redirecting to home (educator route):', `${req.nextUrl.origin}/?redirect_url=${encodeURIComponent(redirectTo)}`);
    return NextResponse.redirect(`${req.nextUrl.origin}/?redirect_url=${encodeURIComponent(redirectTo)}`);
  }

  // Protect dynamic student routes
  if (isStudentClassRoute(req) && !userId) {
    const redirectTo = `${req.nextUrl.origin}${req.nextUrl.pathname}${req.nextUrl.search}`;
    console.log('Redirecting to sign-in (student class route):', `${req.nextUrl.origin}/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`);
    return NextResponse.redirect(`${req.nextUrl.origin}/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`);
  }

  // Handle public routes
  if (!userId && publicRoutes(req)) {
    console.log('Public route, proceeding to next response');
    return NextResponse.next();
  }

  console.log('Authenticated or public route, proceeding to next response');
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
