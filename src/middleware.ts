import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getBaseUrl(request: NextRequest): string {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const proto = forwardedProto || 'https'
    return `${proto}://${forwardedHost}`
  }
  const host = request.headers.get('host') || 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/api']
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const authToken = request.cookies.get('auth_token')?.value
  if (authToken) {
    try {
      const decoded = Buffer.from(authToken, 'base64').toString()
      const [username, password] = decoded.split(':')
      const adminUsername = process.env.ADMIN_USERNAME ?? 'admin'
      const adminPassword = process.env.ADMIN_PASSWORD ?? ''
      if (username === adminUsername && password === adminPassword) {
        return NextResponse.next()
      }
    } catch {}
  }

  const baseUrl = getBaseUrl(request)
  const loginUrl = new URL('/login', baseUrl)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
