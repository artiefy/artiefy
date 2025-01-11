import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Definir rutas públicas
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/', '/estudiantes']);

// Definir rutas protegidas
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isEducatorRoute = createRouteMatcher(['/dashboard/educador(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Permitir acceso a rutas públicas sin autenticación
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  // Redirigir a la página de inicio de sesión si el usuario no está autenticado
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Obtener el rol del usuario
  const userRole = sessionClaims?.metadata?.role as string | undefined;

  // Redirigir a la página de inicio si el usuario no tiene el rol adecuado para la ruta de administrador
  if (isAdminRoute(req) && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Redirigir a la página de inicio si el usuario no tiene el rol adecuado para la ruta de educador
  if (isEducatorRoute(req) && userRole !== 'educator') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Permitir acceso a las rutas protegidas si el usuario está autenticado y tiene el rol adecuado
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas internas de Next.js
    '/((?!_next|opengraph-image|sitemap.xml|robots.txt|.*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Incluir todas las rutas API
    '/(api|trpc)(.*)',
  ],
};