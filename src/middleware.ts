import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Definir rutas protegidas por rol
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/dashboard/super-admin(.*)']);
const isEducatorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isStudentClassRoute = createRouteMatcher(['/estudiantes/clases/:id']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  const currentUrl = req.nextUrl.pathname + req.nextUrl.search;
  const previousUrl = req.headers.get('referer') ?? '/';

  console.log('🌍 URL Actual:', currentUrl);
  console.log('🔍 URL Anterior (Referer):', previousUrl);
  console.log('🆔 Usuario:', userId ?? 'No autenticado');
  console.log('🔑 Rol del usuario:', role ?? 'No definido');

  // Si el usuario no está autenticado y accede a una ruta protegida, redirigir a sign-in con redirect_url
  if (!userId && (isAdminRoute(req) || isSuperAdminRoute(req) || isEducatorRoute(req) || isStudentClassRoute(req))) {
    const redirectTo = encodeURIComponent(previousUrl !== '/' ? previousUrl : currentUrl);
    console.log('🚀 Redirigiendo a /sign-in con redirect_url:', redirectTo);
    return NextResponse.redirect(new URL(`/sign-in?redirect_url=${redirectTo}`, req.url));
  }

  // Verificación de roles para acceso a rutas específicas
  if (isAdminRoute(req) && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isSuperAdminRoute(req) && role !== 'super-admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isEducatorRoute(req) && role !== 'educador') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};