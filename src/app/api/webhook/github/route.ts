import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.text()
  return NextResponse.json({ received: true, bodyLength: body.length })
}
