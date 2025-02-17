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

  // Redirigir a la página de inicio de sesión si no está autenticado y la ruta está protegida
  if (!userId && isProtectedRoute(req)) {
    const redirectTo = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(`${req.nextUrl.origin}/sign-in?redirect_url=${redirectTo}`);
  }

  // Proteger rutas específicas por rol
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

  // Proteger rutas dinámicas de estudiantes
  if (isStudentClassRoute(req) && !userId) {
    const redirectTo = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(`${req.nextUrl.origin}/sign-in?redirect_url=${redirectTo}`);
  }

  // Manejar rutas públicas
  if (!userId && publicRoutes(req)) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Omitir internals de Next.js y todos los archivos estáticos, a menos que se encuentren en los parámetros de búsqueda
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecutar para rutas de API
    '/(api|trpc)(.*)',
  ],
};
