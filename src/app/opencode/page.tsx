'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Terminal, Server } from 'lucide-react'

interface ServerStatus {
  running: boolean
  port: number
  url: string
  pid: number | null
  opencodeAvailable: boolean
  remoteServer: boolean
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
      const res = await fetch('/api/opencode-serve')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        setError(null)
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? `API error: ${res.status}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch error')
    } finally {
      setLoading(false)
    }
  }

  async function handleStart() {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/opencode-serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
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
      setError(e instanceof Error ? e.message : '起動に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStop() {
    setActionLoading(true)
    setError(null)
    try {
      await fetch('/api/opencode-serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })
      setStatus((prev) => (prev ? { ...prev, running: false, pid: null } : null))
      setIframeLoaded(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '停止に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  const canStart = !actionLoading && !loading

  return (
    <main className="flex h-[calc(100vh-1px)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3 bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Terminal className="size-4" />
            </span>
            <h1 className="text-base font-semibold">OpenCode Web UI</h1>
          </div>
          {status && (
            <Badge variant={status.running ? 'default' : 'secondary'}>
              {status.running
                ? `接続中${status.remoteServer ? '' : ` (port ${status.port})`}`
                : '停止中'}
            </Badge>
          )}
          {status?.running && !iframeLoaded && <Badge variant="outline">読み込み中...</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            更新
          </Button>
          {!status?.running ? (
            <Button size="sm" onClick={handleStart} disabled={!canStart}>
              {actionLoading ? '接続中...' : 'サーバー接続'}
            </Button>
          ) : (
            !status?.remoteServer && (
              <Button size="sm" variant="destructive" onClick={handleStop} disabled={actionLoading}>
                {actionLoading ? '停止中...' : 'サーバー停止'}
              </Button>
            )
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
                  <div
                    className="mx-auto mb-4 w-10 h-10 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                  />
                  <div className="mb-1 text-sm text-muted-foreground">
                    OpenCode Web UI を読み込み中...
                  </div>
                  <div className="text-xs text-muted-foreground/60">{status.url}</div>
                </div>
              </div>
            )}
            <iframe
              key={iframeKey}
              src={status.url}
              className={`h-full w-full border-0 ${iframeLoaded ? '' : 'invisible'}`}
              onLoad={() => setIframeLoaded(true)}
              title="OpenCode Web UI"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-sm">
              <div
                className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <Server size={28} strokeWidth={1.5} style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <p className="mb-1 text-base font-medium text-foreground">サーバーは停止しています</p>
              {status?.remoteServer ? (
                <p className="mb-6 text-sm text-muted-foreground">
                  opencode-srv コンテナが起動するのをお待ちください...
                </p>
              ) : (
                <p className="mb-6 text-sm text-muted-foreground">
                  「サーバー接続」ボタンで opencode serve を開始します
                </p>
              )}
              <Button onClick={handleStart} disabled={!canStart}>
                {actionLoading ? '接続中...' : 'サーバー接続'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
