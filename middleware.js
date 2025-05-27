import { NextResponse } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = ['/welcome', '/login', '/register', '/forgot-password']

export function middleware(request) {
  const { pathname } = request.nextUrl

  // If it's the root path, redirect to welcome
  if (pathname === '/') {
    const response = NextResponse.redirect(new URL('/welcome', request.url))
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  // For public routes, allow access and add cache control headers
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next()
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  // For all other routes, continue with normal behavior
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 