import { NextResponse } from "next/server"

function getBaseUrl(request: Request): string {
  const envUrl = process.env.BASE_URL
  if (envUrl) return envUrl.replace(/\/$/, "")

  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host")
  if (forwardedHost) {
    const proto = forwardedProto || "https"
    return `${proto}://${forwardedHost}`
  }
  const host = request.headers.get("host") || "localhost:3000"
  const proto = request.headers.get("x-forwarded-proto") || "http"
  return `${proto}://${host}`
}

function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  if (forwardedProto) return forwardedProto === "https"
  const baseUrl = getBaseUrl(request)
  return baseUrl.startsWith("https://")
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const adminUsername = process.env.ADMIN_USERNAME ?? "admin"
  const adminPassword = process.env.ADMIN_PASSWORD ?? ""

  const baseUrl = getBaseUrl(request)
  const secure = isSecureRequest(request)

  if (username === adminUsername && password === adminPassword) {
    const token = Buffer.from(`${username}:${password}`).toString("base64")
    const res = NextResponse.redirect(new URL("/", baseUrl))
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    })
    return res
  }

  return NextResponse.redirect(new URL("/login?error=1", baseUrl))
}
