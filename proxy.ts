import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin/dashboard routes
  if (pathname.startsWith('/admin/dashboard')) {
    const adminAuth = request.cookies.get('admin_auth')
    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
}
