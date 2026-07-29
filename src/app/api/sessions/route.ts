import { NextRequest, NextResponse } from "next/server"
import { sessionManager } from "@/lib/session-manager"
import { verifyAuth } from "@/lib/auth"
import { store } from "@/lib/store"

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!store.isAvailable()) {
    return NextResponse.json(
      { error: "Database not available", detail: store.getInitError() },
      { status: 503 },
    )
  }
  try {
    const sessions = await sessionManager.list()
    return NextResponse.json(sessions)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!store.isAvailable()) {
    return NextResponse.json(
      { error: "Database not available", detail: store.getInitError() },
      { status: 503 },
    )
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
