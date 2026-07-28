import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token is required" }, { status: 400 })
    }

    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({
        success: true,
        login: data.login,
        scopes: res.headers.get("X-OAuth-Scopes") || "",
      })
    }

    if (res.status === 401) {
      return NextResponse.json(
        { success: false, error: "Invalid token (401 Unauthorized)" },
        { status: 200 },
      )
    }

    if (res.status === 403) {
      return NextResponse.json(
        { success: false, error: "Token is valid but rate limited (403)" },
        { status: 200 },
      )
    }

    return NextResponse.json(
      { success: false, error: `GitHub API responded with status ${res.status}` },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Connection failed" },
      { status: 200 },
    )
  }
}
