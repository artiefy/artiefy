import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isEducadorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
const isProtectedStudentRoute = createRouteMatcher(['/estudiantes/clases/[0-9]+', '/estudiantes/cursos/[0-9]+']);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    // Permitir acceso a rutas públicas sin autenticación
    return NextResponse.next();
  }

  // Proteger todas las rutas no públicas
  const session = await auth();

  if (!session) {
    // Si no hay sesión y es una ruta protegida de estudiante, redirigir a la página de inicio de sesión
    if (isProtectedStudentRoute(req)) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    // Para otras rutas, permitir el acceso (por ejemplo, la página principal de cursos)
    return NextResponse.next();
  }

  const userRole = session.sessionClaims?.metadata?.role;

  // Proteger rutas de admin
  if (isAdminRoute(req) && userRole !== 'admin') {
    const url = new URL('/dashboard', req.url);
    return NextResponse.redirect(url);
  }

  // Proteger rutas de educador
  if (isEducadorRoute(req) && userRole !== 'educador') {
    const url = new URL('/dashboard', req.url);
    return NextResponse.redirect(url);
  }

  // Permitir el acceso si todas las condiciones anteriores se cumplen
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Excluir Next.js internals y archivos estáticos, a menos que se encuentren en los parámetros de búsqueda
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecutar para rutas API
    '/(api|trpc)(.*)',
    '/estudiantes/clases/[0-9]+',
    '/estudiantes/cursos/[0-9]+',
  ],
};

