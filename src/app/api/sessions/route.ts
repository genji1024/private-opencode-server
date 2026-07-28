import { NextRequest, NextResponse } from "next/server"
import { sessionManager } from "@/lib/session-manager"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const sessions = await sessionManager.list()
  return NextResponse.json(sessions)
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { repo, instruction } = body

    if (!repo || !instruction) {
      return NextResponse.json(
        { error: "repo and instruction are required" },
        { status: 400 },
      )
    }

    const session = await sessionManager.create({ repo, instruction })
    return NextResponse.json(session, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
