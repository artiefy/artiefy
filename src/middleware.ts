import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Definir rutas públicas y específicas de roles
const publicRoutes = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/planes(.*)",
  "/opengraph-image(.*)",
  "/sitemap(.*)",
  "/robots(.*)",
  
];
const adminRoutes = ["/dashboard/admin(.*)"];
const profesorRoutes = ["/dashboard/profesores(.*)"];
const estudianteRoutes = ["/estudiantes(.*)"];

// Crear matchers para las rutas
const isPublicRoute = createRouteMatcher(publicRoutes);
const isAdminRoute = createRouteMatcher(adminRoutes);
const isProfesorRoute = createRouteMatcher(profesorRoutes);
const isEstudianteRoute = createRouteMatcher(estudianteRoutes);

export default clerkMiddleware(async (auth, req) => {
  // Proteger rutas privadas si no son públicas
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Obtener la sesión del usuario
  const session = await auth();

  // Redirigir a la ruta principal si no hay sesión activa
  if (!session) {
    const url = new URL("/", process.env.NEXT_PUBLIC_BASE_URL ?? req.url);
    return NextResponse.redirect(url);
  }

  // Verificar acceso a rutas de admin
  if (isAdminRoute(req) && session.sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL ?? req.url));
  }

  // Verificar acceso a rutas de profesor
  if (
    isProfesorRoute(req) &&
    session.sessionClaims?.metadata?.role !== "profesor"
  ) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL ?? req.url));
  }

  // Verificar si el usuario tiene el rol de 'admin' o 'profesor' y está intentando acceder a la ruta de estudiantes
  if (
    isEstudianteRoute(req) &&
    (session.sessionClaims?.metadata?.role === "admin" ||
      session.sessionClaims?.metadata?.role === "profesor")
  ) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL ?? req.url));
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
