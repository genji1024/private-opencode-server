"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ServerStatus {
  running: boolean
  port: number
  url: string
  pid: number | null
  opencodeAvailable: boolean
}

export default function OpenCodeEmbedPage() {
  const [status, setStatus] = React.useState<ServerStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [iframeLoaded, setIframeLoaded] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [iframeKey, setIframeKey] = React.useState(0)

  React.useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch("/api/opencode-serve")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        setError(null)
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? `API error: ${res.status}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch error")
    } finally {
      setLoading(false)
    }
  }

  async function handleStart() {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/opencode-serve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      })
      if (res.ok) {
        const data = await res.json()
        setStatus((prev) => ({ ...prev, ...data, running: true }))
        setIframeLoaded(false)
        setIframeKey((k) => k + 1)
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? `起動に失敗しました (HTTP ${res.status})`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "起動に失敗しました")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStop() {
    setActionLoading(true)
    setError(null)
    try {
      await fetch("/api/opencode-serve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      })
      setStatus((prev) => (prev ? { ...prev, running: false, pid: null } : null))
      setIframeLoaded(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "停止に失敗しました")
    } finally {
      setActionLoading(false)
    }
  }

  const canStart = !actionLoading && !loading && status?.opencodeAvailable !== false

  return (
    <main className="flex h-[calc(100vh-1px)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3 bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" x2="20" y1="19" y2="19" />
              </svg>
            </span>
            <h1 className="text-base font-semibold">OpenCode Web UI</h1>
          </div>
          {status && (
            <Badge variant={status.running ? "default" : "secondary"}>
              {status.running ? `接続中 (port ${status.port})` : "停止中"}
            </Badge>
          )}
          {status?.opencodeAvailable === false && (
            <Badge variant="destructive">opencode CLI 未検出</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            更新
          </Button>
          {!status?.running ? (
            <Button
              size="sm"
              onClick={handleStart}
              disabled={!canStart}
            >
              {actionLoading ? "起動中..." : "サーバー起動"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStop}
              disabled={actionLoading}
            >
              {actionLoading ? "停止中..." : "サーバー停止"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mx-6 mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative flex-1 bg-muted/30">
        {status?.running ? (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                  <div className="mb-1 text-sm text-muted-foreground">
                    OpenCode Web UI を読み込み中...
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    {status.url}
                  </div>
                </div>
              </div>
            )}
            <iframe
              key={iframeKey}
              src={status.url}
              className={`h-full w-full border-0 ${iframeLoaded ? "" : "invisible"}`}
              onLoad={() => setIframeLoaded(true)}
              title="OpenCode Web UI"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-sm">
              <div
                className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "var(--muted)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
              <p className="mb-1 text-base font-medium text-foreground">
                サーバーは停止しています
              </p>
              {status?.opencodeAvailable === false ? (
                <p className="mb-6 text-sm text-destructive">
                  opencode CLI が見つかりません。
                  <br />
                  サーバー環境に opencode がインストールされているか確認してください。
                </p>
              ) : (
                <p className="mb-6 text-sm text-muted-foreground">
                  「サーバー起動」ボタンで opencode serve を開始します
                </p>
              )}
              <Button onClick={handleStart} disabled={!canStart}>
                {actionLoading ? "起動中..." : "サーバー起動"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
