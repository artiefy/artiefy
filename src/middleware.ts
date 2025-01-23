import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isEducatorRoute = createRouteMatcher(['/educadores(.*)']);
const isStudentCourseRoute = createRouteMatcher(['/estudiantes/cursos/:id']);
const isStudentClassRoute = createRouteMatcher(['/estudiantes/clases/:id']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const role = sessionClaims?.metadata?.role;

  // Protect all routes starting with `/admin`
  if (isAdminRoute(req) && role !== 'admin') {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }

  // Protect all routes starting with `/educator`
  if (isEducatorRoute(req) && role !== 'educador') {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }

  // Protect dynamic student routes
  if ((isStudentCourseRoute(req) || isStudentClassRoute(req)) && !userId) {
    return redirectToSignIn();
  }

  // Handle OAuth redirects
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
