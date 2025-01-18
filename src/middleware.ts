import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)'])
const isEducadorRoute = createRouteMatcher(['/dashboard/educador(.*)'])
const isEstudiantesRoute = createRouteMatcher(['/estudiantes/cursos/(.*)', '/estudiantes/clases/(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url)
  const originalPath = url.pathname + url.search

  if (isAdminRoute(req) && (await auth()).sessionClaims?.metadata?.role !== 'admin') {
    const redirectUrl = new URL('/sign-in', req.url)
    redirectUrl.searchParams.set('redirectTo', originalPath)
    return NextResponse.redirect(redirectUrl)
  }
  
  if (isEducadorRoute(req) && (await auth()).sessionClaims?.metadata?.role !== 'educador') {
    const redirectUrl = new URL('/sign-in', req.url)
    redirectUrl.searchParams.set('redirectTo', originalPath)
    return NextResponse.redirect(redirectUrl)
  }

  if (isEstudiantesRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}