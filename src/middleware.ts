import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminRoute = createRouteMatcher(["/dashboard/admin(.*)"])
const isSuperAdminRoute = createRouteMatcher(["/dashboard/super-admin(.*)"])
const isEducatorRoute = createRouteMatcher(["/dashboard/educadores(.*)"])
const isStudentCourseRoute = createRouteMatcher(["/estudiantes/cursos/:id"])
const isStudentClassRoute = createRouteMatcher(["/estudiantes/clases/:id"])

// Nuevo: Matcher para rutas de OG
const isOGRoute = createRouteMatcher([
  "/estudiantes/cursos/:id/opengraph-image",
  "/estudiantes/cursos/:id/twitter-image",
  "/opengraph-image",
  "/twitter-image",
])

export default clerkMiddleware(async (auth, req) => {
  // Primero verificar si es una ruta de OG
  if (isOGRoute(req)) {
    // Permitir acceso sin autenticación a rutas de OG
    return NextResponse.next()
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth()
  const role = sessionClaims?.metadata?.role

  // Proteger todas las rutas que comienzan con el rol`/admin`
  if (isAdminRoute(req) && role !== "admin") {
    const url = new URL("/", req.url)
    return NextResponse.redirect(url)
  }

  // Proteger todas las rutas que comienzan con el rol `/super-admin`
  if (isSuperAdminRoute(req) && role !== "super-admin") {
    const url = new URL("/", req.url)
    return NextResponse.redirect(url)
  }

  // Proteger todas las rutas que comienzan con el rol `/educador`
  if (isEducatorRoute(req) && role !== "educador") {
    const url = new URL("/", req.url)
    return NextResponse.redirect(url)
  }

  // Proteger rutas dinámicas de estudiantes
  // Excluir las rutas de OG de la protección
  if ((isStudentCourseRoute(req) || isStudentClassRoute(req)) && !userId) {
    const path = req.nextUrl.pathname
    if (!path.endsWith("/opengraph-image") && !path.endsWith("/twitter-image")) {
      return redirectToSignIn()
    }
  }

  // Manejar redirecciones de OAuth
  if (req.nextUrl.pathname === "/sso-callback") {
    const redirectUrl = req.nextUrl.searchParams.get("redirect_url")
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl)
    }
  }
})

export const config = {
  matcher: [
    // Omitir internos de Next.js y todos los archivos estáticos, a menos que se encuentren en los parámetros de búsqueda
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre ejecutar para rutas de API
    "/(api|trpc)(.*)",
  ],
}

