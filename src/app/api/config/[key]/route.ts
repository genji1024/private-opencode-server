import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { store } from "@/lib/store"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params

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
    const { value } = body

    if (value === undefined || value === null) {
      return NextResponse.json({ error: "value is required" }, { status: 400 })
    }

    store.setConfig(key, String(value))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params

  if (!verifyAuth(_request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!store.isAvailable()) {
    return NextResponse.json(
      { error: "Database not available", detail: store.getInitError() },
      { status: 503 },
    )
  }

  store.deleteConfig(key)
  return NextResponse.json({ success: true })
}
