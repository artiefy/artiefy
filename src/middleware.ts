import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/dashboard/super-admin(.*)']);
const isEducatorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isStudentCourseRoute = createRouteMatcher(['/estudiantes/cursos/:id']);
const isStudentClassRoute = createRouteMatcher(['/estudiantes/clases/:id']);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims, redirectToSignIn } = await auth();
    const role = sessionClaims?.metadata?.role;

    // Proteger todas las rutas que comienzan con el rol`/admin`
    if (isAdminRoute(req) && role !== 'admin') {
        const url = new URL('/', req.url);
        return NextResponse.redirect(url);
    }

    // Proteger todas las rutas que comienzan con el rol `/super-admin`
    if (isSuperAdminRoute(req) && role !== 'super-admin') {
        const url = new URL('/', req.url);
        return NextResponse.redirect(url);
    }

    // Proteger todas las rutas que comienzan con el rol `/educador`
    if (isEducatorRoute(req) && role !== 'educador') {
        const url = new URL('/', req.url);
        return NextResponse.redirect(url);
    }

    // Proteger rutas dinámicas de estudiantes
    if ((isStudentCourseRoute(req) || isStudentClassRoute(req)) && !userId) {
        return redirectToSignIn();
    }

    // Manejar redirecciones de OAuth
    if (req.nextUrl.pathname === '/sso-callback') {
        const redirectUrl = req.nextUrl.searchParams.get('redirect_url');
        if (redirectUrl) {
            return NextResponse.redirect(redirectUrl);
        }
    }
});

export const config = {
    matcher: [
        // Omitir internos de Next.js y todos los archivos estáticos, a menos que se encuentren en los parámetros de búsqueda
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Siempre ejecutar para rutas de API
        '/(api|trpc)(.*)',
    ],
};
