import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Rutas que necesitan ser protegidas por rol
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isProfesorRoute = createRouteMatcher(['/dashboard/profesores(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth(); // Obtener los claims de la sesión
  const pathname = req.nextUrl.pathname;

  // Verificar si no hay sesión iniciada y el usuario intenta acceder a rutas protegidas
  if (!sessionClaims && (isAdminRoute(req) || isProfesorRoute(req))) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirectTo', pathname); // Añadir parámetro redirectTo para redirigir después de iniciar sesión
    return NextResponse.redirect(signInUrl);  // Redirigir a /sign-in si no hay sesión
  }

  // Verificar acceso a rutas de admin o profesor según el rol del usuario
  if (isAdminRoute(req) && sessionClaims?.metadata?.role !== 'admin') {
    // Si no es admin, redirigir a /unauthorized
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  if (isProfesorRoute(req) && sessionClaims?.metadata?.role !== 'profesor') {
    // Si no es profesor, redirigir a /unauthorized
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // Permitir acceso si el rol es adecuado o si la ruta no es protegida
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Ignorar rutas internas y archivos estáticos
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecutar para rutas API
    '/(api|trpc)(.*)',
  ],
};
