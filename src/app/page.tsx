"use client"

import Link from "next/link"
import React from "react"
import { SessionRow } from "@/lib/store"

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
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">OpenCode Server</h1>
        <p className="text-lg text-gray-600">
          OpenCode ヘッドレスサーバーの管理ダッシュボード
        </p>
      </div>

      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/sessions"
            className="rounded-lg border p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">セッション管理 &rarr;</h2>
            <p className="text-sm text-gray-500">
              実行中のセッション一覧と詳細を確認
            </p>
          </Link>
          <Link
            href="/sessions/new"
            className="rounded-lg border p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">新規セッション &rarr;</h2>
            <p className="text-sm text-gray-500">
              新しい opencode セッションを開始
            </p>
          </Link>
          <Link
            href="/settings"
            className="rounded-lg border p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">設定 &rarr;</h2>
            <p className="text-sm text-gray-500">
              トークン・リポジトリ設定の管理
            </p>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-lg border p-6 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-800">
              {loading ? "..." : activeSessions}
            </h3>
            <p className="text-sm text-blue-600">アクティブなセッション</p>
          </div>
          <div className="rounded-lg border p-6 bg-green-50">
            <h3 className="text-lg font-semibold text-green-800">
              {loading ? "..." : completedSessions}
            </h3>
            <p className="text-sm text-green-600">完了したセッション</p>
          </div>
          <div className="rounded-lg border p-6 bg-red-50">
            <h3 className="text-lg font-semibold text-red-800">
              {loading ? "..." : failedSessions}
            </h3>
            <p className="text-sm text-red-600">失敗したセッション</p>
          </div>
        </div>

        {!loading && !error && recentSessions.length > 0 && (
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">直近のセッション</h2>
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        s.status === "running"
                          ? "bg-blue-500"
                          : s.status === "completed"
                            ? "bg-green-500"
                            : s.status === "failed"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                      }`}
                    />
                    <span className="font-mono text-sm">
                      {s.id.slice(0, 8)}...
                    </span>
                    <span className="text-sm text-gray-600">{s.repo}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(s.startedAt).toLocaleString("ja-JP")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border p-6 bg-red-50 text-red-700">
            ダッシュボードの読み込みに失敗しました: {error}
          </div>
        )}
      </div>
    </main>
  )
}
