// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRole } from "~/utils/roles";  // Importa la función checkRole

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();  // Obtén los claims de la sesión

  const isAdminRoute = req.nextUrl.pathname.startsWith("/dashboard/admin");
  const isProfesorRoute = req.nextUrl.pathname.startsWith("/dashboard/profesores");
  const isPublicRoute = req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up") ||
    req.nextUrl.pathname === "/";

  // Si no hay sesión iniciada, redirigir a la página de login
  if (!sessionClaims && (isAdminRoute || isProfesorRoute)) {
    // Redirigir a /sign-in si no hay sesión, pasando la ruta original como parámetro de redirección
    const redirectUrl = req.nextUrl.pathname + req.nextUrl.search;  // Obtener la ruta actual con parámetros
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', redirectUrl);  // Añadir la URL de redirección al parámetro
    return NextResponse.redirect(signInUrl);
  }

  // Rutas públicas no requieren autenticación
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificación de acceso a las rutas con roles específicos
  if (isAdminRoute && !(await checkRole("admin", sessionClaims))) {
    // Si no es admin, redirigir a una página de "No autorizado"
    return NextResponse.redirect(new URL('/unauthorized', req.url)); 
  }

  if (isProfesorRoute && !(await checkRole("profesor", sessionClaims))) {
    // Si no es profesor, redirigir a una página de "No autorizado"
    return NextResponse.redirect(new URL('/unauthorized', req.url)); 
  }

  // Permitir el acceso a rutas autorizadas
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
