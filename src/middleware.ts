import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isEducadorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
const isProtectedStudentRoute = createRouteMatcher([
  '/estudiantes/cursos/:id',
  '/estudiantes/clases/:id',
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
    // Excluir Next.js internals y archivos estáticos, a menos que se encuentren en los parámetros de búsqueda
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecutar para rutas API
    '/(api|trpc)(.*)',
    '/estudiantes/cursos/:path*',
    '/estudiantes/clases/:path*',
  ],
};
