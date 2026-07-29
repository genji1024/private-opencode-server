import { NextRequest } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { store, LogRow } from "@/lib/store"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!verifyAuth(_request)) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (!store.isAvailable()) {
    return new Response(`Database not available: ${store.getInitError() ?? "unknown"}`, { status: 503 })
  }

  const session = store.getSession(id)
  if (!session) {
    return new Response("Session not found", { status: 404 })
  }

  let lastIndex = 0
  const existingLogs = store.getLogs(id)
  lastIndex = existingLogs.length

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      for (const log of existingLogs) {
        const data = `data: ${JSON.stringify(log)}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      const interval = setInterval(() => {
        const logs = store.getLogs(id)
        const newLogs = logs.slice(lastIndex)
        for (const log of newLogs) {
          const data = `data: ${JSON.stringify(log)}\n\n`
          controller.enqueue(encoder.encode(data))
        }
        lastIndex = logs.length

        const currentSession = store.getSession(id)
        if (currentSession && currentSession.status !== "running") {
          const remaining = store.getLogs(id).slice(lastIndex)
          for (const log of remaining) {
            const data = `data: ${JSON.stringify(log)}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify(currentSession)}\n\n`))
          clearInterval(interval)
          controller.close()
        }
      }, 500)

      _request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
