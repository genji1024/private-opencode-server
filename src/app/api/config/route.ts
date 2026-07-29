import { NextRequest, NextResponse } from "next/server"
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

  const configs = store.listConfigs()
  return NextResponse.json(configs)
}
