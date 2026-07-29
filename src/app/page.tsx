"use client"

import Link from "next/link"
import React from "react"
import { SessionRow } from "@/lib/store"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const [sessions, setSessions] = React.useState<SessionRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch("/api/sessions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sessions")
        return res.json()
      })
      .then((data) => {
        setSessions(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const activeSessions = sessions.filter((s) => s.status === "running").length
  const completedSessions = sessions.filter((s) => s.status === "completed").length
  const failedSessions = sessions.filter((s) => s.status === "failed").length
  const recentSessions = sessions.slice(0, 5)

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">OpenCode Server</h1>
          <p className="mt-2 text-muted-foreground">
            OpenCode ヘッドレスサーバーの管理ダッシュボード
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/opencode">
            <Card className="hover:shadow-md transition-shadow border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <polyline points="4 17 10 11 4 5" />
                    <line x1="12" x2="20" y1="19" y2="19" />
                  </svg>
                  OpenCode Web UI
                </CardTitle>
                <CardDescription>opencode の Web UI をブラウザで操作</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/sessions">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">セッション管理</CardTitle>
                <CardDescription>実行中のセッション一覧と詳細を確認</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/sessions/new">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">新規セッション</CardTitle>
                <CardDescription>新しい opencode セッションを開始</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/settings">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">設定</CardTitle>
                <CardDescription>トークン・リポジトリ設定の管理</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>アクティブなセッション</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {loading ? "..." : activeSessions}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>完了したセッション</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {loading ? "..." : completedSessions}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>失敗したセッション</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {loading ? "..." : failedSessions}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {!loading && !error && recentSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>直近のセッション</CardTitle>
            </CardHeader>
            <div className="divide-y">
              {recentSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex justify-between items-center p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusDot status={s.status} />
                    <span className="font-mono text-sm text-muted-foreground">
                      {s.id.slice(0, 8)}...
                    </span>
                    <span className="text-sm">{s.repo}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.startedAt).toLocaleString("ja-JP")}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">エラー</CardTitle>
              <CardDescription>
                ダッシュボードの読み込みに失敗しました: {error}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </main>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "bg-blue-500",
    completed: "bg-green-500",
    failed: "bg-red-500",
    pending: "bg-yellow-500",
  }
  return (
    <span
      className={`w-2 h-2 rounded-full ${colors[status] || "bg-gray-500"}`}
    />
  )
}
