import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import {
  startServer,
  stopServer,
  getServerStatus,
} from "@/lib/opencode-serve"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    return NextResponse.json(getServerStatus())
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = body

    if (action === "start") {
      const result = await startServer()
      return NextResponse.json({ ...result, running: true })
    }

    if (action === "stop") {
      const stopped = stopServer()
      return NextResponse.json({ stopped })
    }

    return NextResponse.json(
      { error: 'Unknown action. Use "start" or "stop".' },
      { status: 400 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
