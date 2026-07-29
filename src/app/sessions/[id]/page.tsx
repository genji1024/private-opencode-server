"use client"

import React from "react"
import Link from "next/link"
import { SessionRow, LogRow } from "@/lib/store"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
      <main className="min-h-screen p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-muted-foreground">読み込み中...</div>
      </main>
    )
  }

  if (error || !session) {
    return (
      <main className="min-h-screen p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "セッションが見つかりません"}
            </AlertDescription>
          </Alert>
          <Link href="/sessions" className={buttonVariants({ variant: "link", className: "mt-4" })}>
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

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    running: "default",
    completed: "secondary",
    failed: "destructive",
    pending: "outline",
  }

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/sessions" className={buttonVariants({ variant: "link", className: "mb-4 -ml-2" })}>
          ← 一覧に戻る
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>セッション詳細</CardTitle>
              </div>
              {session.status === "running" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                >
                  キャンセル
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DetailRow label="ID" value={session.id} mono />
              <DetailRow
                label="ステータス"
                value={
                  <Badge variant={statusVariants[session.status] || "outline"}>
                    {statusLabels[session.status] || session.status}
                  </Badge>
                }
              />
              <DetailRow label="リポジトリ" value={session.repo} />
              <DetailRow label="イベント" value={session.event} />
              <DetailRow label="開始時刻" value={formatDate(session.startedAt)} />
              {session.finishedAt && (
                <DetailRow label="終了時刻" value={formatDate(session.finishedAt)} />
              )}
              {session.exitCode !== null && (
                <DetailRow label="終了コード" value={String(session.exitCode)} mono />
              )}
              {session.error && (
                <div className="col-span-2">
                  <Alert variant="destructive">
                    <AlertDescription>
                      <span className="font-medium">エラー: </span>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                        {session.error}
                      </pre>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ログ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 font-mono text-xs h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">ログはまだありません</div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={log.stream === "stderr" ? "text-destructive" : ""}
                  >
                    <span className="text-muted-foreground mr-2">
                      {new Date(log.timestamp).toLocaleTimeString("ja-JP")}
                    </span>
                    {log.text}
                  </div>
                ))
              )}
              {session.status === "running" && (
                <div className="text-muted-foreground animate-pulse mt-2">
                  ログを受信中...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {session.status === "running" && (
          <Card>
            <CardHeader>
              <CardTitle>メッセージを送信</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="opencode に送信する指示を入力..."
                  rows={3}
                />
                {sendError && (
                  <Alert variant="destructive">
                    <AlertDescription>{sendError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={sending || !message.trim()}>
                  {sending ? "送信中..." : "送信"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("ja-JP")
  }
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className={mono ? "font-mono" : ""}>{value}</span>
    </div>
  )
}
