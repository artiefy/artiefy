import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRole } from "~/utils/roles";

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Rutas protegidas específicas
  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isProfesorRoute = pathname.startsWith("/dashboard/profesores");

  // Rutas públicas (no requieren autenticación)
  const isPublicRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/";

  // Si no hay sesión activa y la ruta no es pública
  if (!sessionClaims && !isPublicRoute) {
    const redirectUrl = `${pathname}${url.search}`; // Guardar la ruta original con parámetros
    const signInUrl = new URL("/sign-in", req.url); // Redirigir siempre al único endpoint
    signInUrl.searchParams.set("redirect_url", redirectUrl); // Pasar la ruta original como parámetro
    return NextResponse.redirect(signInUrl);
  }

  // Permitir acceso a rutas públicas
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar roles según las rutas protegidas
  if (isAdminRoute && !(await checkRole("admin", sessionClaims))) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isProfesorRoute && !(await checkRole("profesor", sessionClaims))) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

 
  // Permitir acceso si las condiciones se cumplen
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
