import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Definir rutas privadas y específicas de roles
const protectedRoutes = [
  "/dashboard(.*)",
  "/estudiantes(.*)"
];
const adminRoutes = ["/dashboard/admin(.*)"];
const profesorRoutes = ["/dashboard/profesores(.*)"];

// Crear matchers para las rutas
const isProtectedRoute = createRouteMatcher(protectedRoutes);
const isAdminRoute = createRouteMatcher(adminRoutes);
const isProfesorRoute = createRouteMatcher(profesorRoutes);

export default clerkMiddleware(async (auth, req) => {
  // Proteger rutas privadas
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Obtener la sesión del usuario
  const session = await auth();

  // Redirigir a la ruta principal si no hay sesión activa
  if (!session) {
    const redirectUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Verificar acceso a rutas de admin
  if (isAdminRoute(req) && session.sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Verificar acceso a rutas de profesor
  if (
    isProfesorRoute(req) &&
    session.sessionClaims?.metadata?.role !== "profesor"
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Verificar si el usuario tiene el rol de 'admin' o 'profesor' y está intentando acceder a la ruta de estudiantes
  if (
    isProtectedRoute(req) &&
    (session.sessionClaims?.metadata?.role === "admin" ||
      session.sessionClaims?.metadata?.role === "profesor")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    // Excluir Next.js internos y archivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre ejecutar para rutas API
    "/(api|trpc)(.*)",
  ],
};
