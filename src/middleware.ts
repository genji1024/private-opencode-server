import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = ["/login", "/api/auth"]
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const authToken = request.cookies.get("auth_token")?.value
  if (authToken) {
    try {
      const decoded = Buffer.from(authToken, "base64").toString()
      const [username, password] = decoded.split(":")
      const adminUsername = process.env.ADMIN_USERNAME ?? "admin"
      const adminPassword = process.env.ADMIN_PASSWORD ?? ""
      if (username === adminUsername && password === adminPassword) {
        return NextResponse.next()
      }
    } catch {}
  }

  const url = request.nextUrl.clone()
  url.pathname = "/login"
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
