import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { store } from "@/lib/store"

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const configs = store.listConfigs()
  return NextResponse.json(configs)
}
