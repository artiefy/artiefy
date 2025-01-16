import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isEducadorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
const isProtectedStudentRoute = createRouteMatcher([
  '/estudiantes(.*)',
  '/estudiantes/cursos/:id',
  '/estudiantes/clases/:id'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session) {
    if (isProtectedStudentRoute(req)) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  const userRole = session.sessionClaims?.metadata?.role;

  if (isAdminRoute(req) && userRole !== 'admin') {
    const url = new URL('/dashboard', req.url);
    return NextResponse.redirect(url);
  }

  if (isEducadorRoute(req) && userRole !== 'educador') {
    const url = new URL('/dashboard', req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/estudiantes/:path*',
    '/estudiantes/cursos/:path*',
    '/estudiantes/clases/:path*'
  ]
};

