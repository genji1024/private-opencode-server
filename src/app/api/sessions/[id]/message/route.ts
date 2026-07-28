import { NextRequest, NextResponse } from "next/server"
import { sessionManager } from "@/lib/session-manager"
import { verifyAuth } from "@/lib/auth"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!verifyAuth(_request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await _request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      )
    }

    const sent = await sessionManager.sendMessage(id, message)
    if (!sent) {
      return NextResponse.json(
        { error: "Session not found or process not running" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
