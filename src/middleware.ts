import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashbaord/admin(.*)']);
const isEducadorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
const isProtectedStudentRoute = createRouteMatcher([
  '/estudiantes/cursos/:id',
  '/estudiantes/clases/:id',
]);

const handleRedirect = (url: string, request: Request) => {
  const redirectUrl = new URL(url, request.url);
  redirectUrl.searchParams.set('redirect', request.url);
  return NextResponse.redirect(redirectUrl);
};

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session) {
    return handleRedirect('/sign-in', request);
  }

  const userRole = session?.sessionClaims?.metadata?.role;

  if (isAdminRoute(request) && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isEducadorRoute(request) && userRole !== 'educador') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isProtectedStudentRoute(request) && !session) {
    return handleRedirect('/sign-in', request);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/estudiantes/cursos/:path*',
    '/estudiantes/clases/:path*',
  ],
};
