import { NextResponse } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = ['/welcome', '/login', '/register', '/forgot-password']

export function middleware(request) {
  const { pathname } = request.nextUrl

  // If it's the root path, redirect to welcome
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/welcome', request.url))
  }

  // If it's a public route, allow access
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // For welcome page, ensure it's not redirected
    if (pathname === '/welcome') {
      const response = NextResponse.next()
      // Add cache control headers to prevent caching
      response.headers.set('Cache-Control', 'no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }
    return NextResponse.next()
  }

  // For all other routes, continue with normal behavior
  return NextResponse.next()
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
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 