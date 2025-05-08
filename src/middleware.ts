import { NextResponse } from 'next/server';

import {
	clerkMiddleware,
	createRouteMatcher,
	type ClerkMiddlewareOptions,
} from '@clerk/nextjs/server';

// Protected route matchers with documentation
const routeMatchers = {
	admin: createRouteMatcher(['/dashboard/admin(.*)']) as (
		req: Request
	) => boolean,
	superAdmin: createRouteMatcher(['/dashboard/super-admin(.*)']) as (
		req: Request
	) => boolean,
	educador: createRouteMatcher(['/dashboard/educadores(.*)']) as (
		req: Request
	) => boolean,
	student: createRouteMatcher(['/estudiantes/clases/:id']) as (
		req: Request
	) => boolean,
	protected: createRouteMatcher(['/dashboard(.*)']) as (
		req: Request
	) => boolean,
};

// Middleware configuration
const middlewareConfig: ClerkMiddlewareOptions = {
	authorizedParties: [
		'https://artiefy.com',
		'https://accounts.artiefy.com',
		...(process.env.NODE_ENV === 'development'
			? ['http://localhost:3000']
			: []),
	],
	clockSkewInMs: 60 * 1000, // 60 seconds tolerance
};

export default clerkMiddleware(async (auth, req) => {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata?.role;

		// Check for protected routes
		const isProtectedRoute = Object.values(routeMatchers).some((matcher) =>
			matcher(req)
		);

		// If not a protected route, allow access
		if (!isProtectedRoute) {
			return NextResponse.next();
		}

		// Handle unauthenticated users for protected routes
		if (!userId) {
			return NextResponse.redirect(
				new URL(`/sign-in?redirect_url=${encodeURIComponent(req.url)}`, req.url)
			);
		}

		// Role-based access control with dynamic redirect
		if (routeMatchers.admin(req) && role !== 'admin') {
			return NextResponse.redirect(new URL('/', req.url));
		}

		if (routeMatchers.superAdmin(req) && role !== 'super-admin') {
			return NextResponse.redirect(new URL('/', req.url));
		}

		if (routeMatchers.educador(req) && role !== 'educador') {
			return NextResponse.redirect(new URL('/', req.url));
		}

		// Student route protection with dynamic redirect
		if (routeMatchers.student(req) && !userId) {
			return NextResponse.redirect(
				new URL(`/sign-in?redirect_url=${encodeURIComponent(req.url)}`, req.url)
			);
		}

		return NextResponse.next();
	} catch (error) {
		console.error('Middleware error:', error);
		return NextResponse.redirect(new URL('/error', req.url));
	}
}, middlewareConfig);

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		'/(api|trpc)(.*)',
	],
};
