"use client"

import React from "react"

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
    <main className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">OpenCode Web UI</h1>
          {status && (
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${status.running ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
            >
              {status.running ? `接続中 (port ${status.port})` : "停止中"}
            </span>
          )}
          {status?.opencodeAvailable === false && (
            <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              opencode CLI 未検出
            </span>
          )}
          {status?.running && !iframeLoaded && (
            <span className="text-xs text-yellow-600">読み込み中...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            更新
          </button>
          {!status?.running ? (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? "起動中..." : "サーバー起動"}
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={actionLoading}
              className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? "停止中..." : "サーバー停止"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="border-b bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative flex-1 bg-gray-100">
        {status?.running ? (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-2 text-lg text-gray-500">
                    OpenCode Web UI を読み込み中...
                  </div>
                  <div className="text-sm text-gray-400">
                    {status.url}
                  </div>
                </div>
              </div>
            )}
            <iframe
              src={status.url}
              className={`h-full w-full border-0 ${iframeLoaded ? "" : "invisible"}`}
              onLoad={() => setIframeLoaded(true)}
              title="OpenCode Web UI"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-6xl">&#9881;</div>
              <p className="mb-2 text-lg text-gray-600">
                OpenCode サーバーは停止しています
              </p>
              {status?.opencodeAvailable === false ? (
                <p className="mb-6 text-sm text-red-500">
                  opencode CLI が見つかりません。
                  <br />
                  サーバー環境に opencode がインストールされているか確認してください。
                </p>
              ) : (
                <p className="mb-6 text-sm text-gray-400">
                  「サーバー起動」ボタンで opencode serve を開始します
                </p>
              )}
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? "起動中..." : "サーバー起動"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
