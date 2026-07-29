"use client"

import React from "react"
import Link from "next/link"
import { SessionRow, LogRow } from "@/lib/store"

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <SessionDetail params={params} />
}

function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedId, setResolvedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    params.then((p) => setResolvedId(p.id))
  }, [params])

  const [session, setSession] = React.useState<SessionRow | null>(null)
  const [logs, setLogs] = React.useState<LogRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [sendError, setSendError] = React.useState<string | null>(null)

  const fetchSession = React.useCallback(async () => {
    if (!resolvedId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/sessions/${resolvedId}`)
      if (!res.ok) throw new Error("Session not found")
      const data = await res.json()
      setSession(data.session)
      setLogs(data.logs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [resolvedId])

  React.useEffect(() => {
    if (!resolvedId) return
    fetchSession()
  }, [resolvedId, fetchSession])

  React.useEffect(() => {
    if (!resolvedId || error) return

    const eventSource = new EventSource(`/api/sessions/${resolvedId}/stream`)

    eventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data) as LogRow
        setLogs((prev) => [...prev, log])
      } catch {}
    }

    eventSource.addEventListener("done", (event) => {
      try {
        const updated = JSON.parse(event.data) as SessionRow
        setSession(updated)
      } catch {}
      eventSource.close()
    })

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [resolvedId, error])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || !resolvedId) return

    try {
      setSending(true)
      setSendError(null)
      const res = await fetch(`/api/sessions/${resolvedId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to send message")
      }
      setMessage("")
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  async function handleCancel() {
    if (!resolvedId) return
    if (!confirm("このセッションをキャンセルしますか？")) return
    try {
      const res = await fetch(`/api/sessions/${resolvedId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to cancel session")
      fetchSession()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cancel failed")
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-gray-500">読み込み中...</div>
      </main>
    )
  }

  if (error || !session) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-red-500">
          {error || "セッションが見つかりません"}
          <Link href="/sessions" className="block mt-4 text-blue-600 hover:underline">
            ← 一覧に戻る
          </Link>
        </div>
      </main>
    )
  }

  const statusLabels: Record<string, string> = {
    running: "実行中",
    completed: "完了",
    failed: "失敗",
    pending: "待機中",
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/sessions"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← 一覧に戻る
        </Link>

        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">セッション詳細</h1>
            {session.status === "running" && (
              <button
                onClick={handleCancel}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                キャンセル
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">ID:</span>
              <span className="ml-2 font-mono">{session.id}</span>
            </div>
            <div>
              <span className="text-gray-500">ステータス:</span>
              <span className="ml-2">{statusLabels[session.status] || session.status}</span>
            </div>
            <div>
              <span className="text-gray-500">リポジトリ:</span>
              <span className="ml-2">{session.repo}</span>
            </div>
            <div>
              <span className="text-gray-500">イベント:</span>
              <span className="ml-2">{session.event}</span>
            </div>
            <div>
              <span className="text-gray-500">開始時刻:</span>
              <span className="ml-2">{formatDate(session.startedAt)}</span>
            </div>
            {session.finishedAt && (
              <div>
                <span className="text-gray-500">終了時刻:</span>
                <span className="ml-2">{formatDate(session.finishedAt)}</span>
              </div>
            )}
            {session.exitCode !== null && (
              <div>
                <span className="text-gray-500">終了コード:</span>
                <span className="ml-2 font-mono">{session.exitCode}</span>
              </div>
            )}
            {session.error && (
              <div className="col-span-2">
                <span className="text-gray-500">エラー:</span>
                <pre className="mt-1 p-2 bg-red-50 text-red-700 rounded text-xs overflow-x-auto">
                  {session.error}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">ログ</h2>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">ログはまだありません</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`${log.stream === "stderr" ? "text-red-400" : "text-gray-100"}`}
                >
                  <span className="text-gray-500 mr-2">
                    {new Date(log.timestamp).toLocaleTimeString("ja-JP")}
                  </span>
                  {log.text}
                </div>
              ))
            )}
            {session.status === "running" && (
              <div className="text-gray-500 animate-pulse mt-2">
                ログを受信中...
              </div>
            )}
          </div>
        </div>

        {session.status === "running" && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">メッセージを送信</h2>
            <form onSubmit={handleSendMessage}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="opencode に送信する指示を入力..."
                rows={3}
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {sendError && (
                <p className="text-red-500 text-sm mt-2">{sendError}</p>
              )}
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? "送信中..." : "送信"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("ja-JP")
  }
}
