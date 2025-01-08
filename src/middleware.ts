import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)'])
const isProfesorRoute = createRouteMatcher(['/dashboard/educadores(.*)'])
const isEstudianteRoute = createRouteMatcher(['/estudiantes(.*)', '/sign-in', '/sign-up'])

export default clerkMiddleware(async (auth, req) => {
  const sessionClaims = (await auth()).sessionClaims?.metadata
  const role = sessionClaims?.role

  if (isAdminRoute(req) && role !== 'admin') {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }

  if (isProfesorRoute(req) && role !== 'educador') {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }

  if (isEstudianteRoute(req) && role !== 'estudiante' && role !== undefined) {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}