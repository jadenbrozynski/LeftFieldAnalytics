import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if it's a public route
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If already logged in and trying to access login, redirect to dashboard
    const isLoggedIn = request.cookies.get('admin_auth')?.value === 'true'
    if (isLoggedIn && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Check if it's an API route (allow through for now)
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Check if it's a static file
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check for auth cookie
  const isLoggedIn = request.cookies.get('admin_auth')?.value === 'true'

  if (!isLoggedIn) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
}
