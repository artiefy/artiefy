import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isEducadorRoute = createRouteMatcher(['/dashboard/educadores(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Proteger rutas de admin
  if (
    isAdminRoute(req) &&
    (await auth()).sessionClaims?.metadata?.role !== 'admin'
  ) {
    const url = new URL('/sign-in', req.url);
    return NextResponse.redirect(url);
  }

  // Proteger rutas de educador
  if (
    isEducadorRoute(req) &&
    (await auth()).sessionClaims?.metadata?.role !== 'educador'
  ) {
    const url = new URL('/sign-in', req.url);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
