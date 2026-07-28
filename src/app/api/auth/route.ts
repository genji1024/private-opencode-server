import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const formData = await request.formData()
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const adminUsername = process.env.ADMIN_USERNAME ?? "admin"
  const adminPassword = process.env.ADMIN_PASSWORD ?? ""

  if (username === adminUsername && password === adminPassword) {
    const token = Buffer.from(`${username}:${password}`).toString("base64")
    const res = NextResponse.redirect(new URL("/", request.url))
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    })
    return res
  }

  return NextResponse.redirect(new URL("/login?error=1", request.url))
}
