import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/dashboard/super-admin(.*)']);
const isEducatorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);
const isStudentClassRoute = createRouteMatcher(['/estudiantes/clases/:id']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)']);
const publicRoutes = createRouteMatcher(['/sign-in', '/sign-up']);

export default clerkMiddleware(async (auth, req) => {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	// Si es una ruta pública, permitir acceso
	if (publicRoutes(req)) {
		return NextResponse.next();
	}

	// Redirigir a login si no está autenticado y la ruta es protegida
	if (!userId && isProtectedRoute(req)) {
		return NextResponse.redirect(new URL('/sign-in', req.url));
	}

	// Proteger rutas específicas por rol
	if (isAdminRoute(req) && role !== 'admin') {
		return NextResponse.redirect(new URL('/', req.url));
	}

	if (isSuperAdminRoute(req) && role !== 'super-admin') {
		return NextResponse.redirect(new URL('/', req.url));
	}

	if (isEducatorRoute(req) && role !== 'educador') {
		return NextResponse.redirect(new URL('/', req.url));
	}

	// Proteger rutas dinámicas de estudiantes
	if (isStudentClassRoute(req) && !userId) {
		return NextResponse.redirect(new URL('/sign-in', req.url));
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		// Always run for API routes
		'/(api|trpc)(.*)',
	],
};
