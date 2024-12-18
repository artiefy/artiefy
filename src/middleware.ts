import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/dashboard/admin(.*)"]);
const isProfesorRoute = createRouteMatcher(["/dashboard/profesores(.*)"]);
const isEstudianteRoute = createRouteMatcher(["/dashboard/estudiantes(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/unauthorized",
  "/dashboard/estudiantes",
]);

export default clerkMiddleware(async (auth, req) => {
  const sessionClaims = await auth();

  // Verifica el rol del usuario
  const userRole = sessionClaims?.sessionClaims?.metadata?.role;

  // Construir la URL base
  const baseUrl = new URL(req.url).origin;

  // Redirección automática basado en el rol
  if (userRole === "admin" && !isAdminRoute(req)) {
    // Redirigir a la URL absoluta para el rol admin
    return NextResponse.redirect(`${baseUrl}/dashboard/admin`);
  }

  if (userRole === "profesor" && !isProfesorRoute(req)) {
    // Redirigir a la URL absoluta para el rol profesor
    return NextResponse.redirect(`${baseUrl}/dashboard/profesores`);
  }

  // Rutas de estudiantes
  if (isEstudianteRoute(req)) {
    return NextResponse.next();
  }

  // Rutas públicas no necesitan protección
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Si el usuario no está autenticado y accede a una ruta privada
  if (!userRole) {
    // Redirigir a la URL de inicio de sesión si el usuario no tiene un rol
    const url = new URL("/unauthorized", req.url);
    return NextResponse.redirect(url.toString());
  }

  // Permitir el acceso a otras rutas no protegidas
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
