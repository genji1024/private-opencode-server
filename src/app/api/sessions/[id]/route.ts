import { NextRequest, NextResponse } from "next/server"
import { sessionManager } from "@/lib/session-manager"
import { verifyAuth } from "@/lib/auth"
import { store } from "@/lib/store"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!verifyAuth(_request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!store.isAvailable()) {
    return NextResponse.json(
      { error: "Database not available", detail: store.getInitError() },
      { status: 503 },
    )
  }

  const detail = await sessionManager.get(id)
  if (!detail) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return NextResponse.json(detail)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!verifyAuth(_request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await sessionManager.cancelSession(id)
  return NextResponse.json({ success: true })
}
