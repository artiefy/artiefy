import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isAdminRoute = createRouteMatcher(["/dashboard/admin(.*)"]);
const isProfesorRoute = createRouteMatcher(["/dashboard/profesores(.*)"]);
const isEstudianteRoute = createRouteMatcher(["/dashboard/estudiantes(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Proteger rutas privadas si no son públicas
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Obtener la sesión del usuario
  const session = await auth();

  // Verificar acceso a rutas de admin
  if (isAdminRoute(req) && session.sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Verificar acceso a rutas de profesor
  if (
    isProfesorRoute(req) &&
    session.sessionClaims?.metadata?.role !== "profesor"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Verificar si el usuario tiene el rol de 'admin' o 'profesor' y está intentando acceder a la ruta de estudiantes
  if (
    isEstudianteRoute(req) &&
    (session.sessionClaims?.metadata?.role === "admin" ||
      session.sessionClaims?.metadata?.role === "profesor")
  ) {
    return NextResponse.redirect(new URL("/", req.url)); // Redirige a la página principal o la que prefieras
  }
});

export const config = {
  matcher: [
    // Coincide con todas las rutas relevantes
    "/dashboard/(admin|profesores|estudiantes)(.*)",
    // Asegurarse de que las rutas de inicio de sesión y registro sean públicas
    "/sign-in(.*)",
    "/sign-up(.*)",
    // Excluir Next.js internos y archivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre ejecutar para rutas API
    "/(api|trpc)(.*)",
  ],
};
