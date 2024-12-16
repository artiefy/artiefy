import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRole } from "~/utils/roles";

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isProfesorRoute = pathname.startsWith("/dashboard/profesores");
  const isEstudianteRoute = pathname.startsWith("/dashboard/estudiantes");

  const isPublicRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/";

  if (!sessionClaims && !isPublicRoute) {
    const redirectUrl = `${pathname}${url.search}`;
    let signInUrl;

    if (isAdminRoute) {
      signInUrl = new URL("/sign-in/admin", req.url);
    } else if (isProfesorRoute) {
      signInUrl = new URL("/sign-in/profesores", req.url);
    } else if (isEstudianteRoute) {
      signInUrl = new URL("/sign-in/estudiantes", req.url);
    }

    if (signInUrl) {
      signInUrl.searchParams.set("redirect_url", redirectUrl);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (isAdminRoute && !(await checkRole("admin", sessionClaims))) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isProfesorRoute && !(await checkRole("profesor", sessionClaims))) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }


  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
