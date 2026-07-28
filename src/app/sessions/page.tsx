"use client"

import Link from "next/link"
import React from "react"
import { SessionRow } from "@/lib/store"

export default function SessionsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">セッション一覧</h1>
          <Link
            href="/sessions/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            + 新規セッション
          </Link>
        </div>
        <SessionList />
      </div>
    </main>
  )
}

function SessionList() {
  const [sessions, setSessions] = React.useState<SessionRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    try {
      setLoading(true)
      const res = await fetch("/api/sessions")
      if (!res.ok) throw new Error("Failed to fetch sessions")
      const data = await res.json()
      setSessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("このセッションをキャンセルしますか？")) return
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to cancel session")
      fetchSessions()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cancel failed")
    }
  }

  if (loading) {
    return <div className="text-gray-500">読み込み中...</div>
  }

  if (error) {
    return <div className="text-red-500">エラー: {error}</div>
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-4">セッションがありません</p>
        <Link
          href="/sessions/new"
          className="text-blue-600 hover:underline"
        >
          最初のセッションを作成する
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-3 px-4 font-medium text-gray-600">ID</th>
            <th className="py-3 px-4 font-medium text-gray-600">リポジトリ</th>
            <th className="py-3 px-4 font-medium text-gray-600">ステータス</th>
            <th className="py-3 px-4 font-medium text-gray-600">開始時刻</th>
            <th className="py-3 px-4 font-medium text-gray-600">アクション</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-sm">
                {session.id.slice(0, 8)}...
              </td>
              <td className="py-3 px-4">{session.repo}</td>
              <td className="py-3 px-4">
                <StatusBadge status={session.status} />
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {formatDate(session.startedAt)}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <Link
                    href={`/sessions/${session.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    詳細
                  </Link>
                  {session.status === "running" && (
                    <button
                      onClick={() => handleCancel(session.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      キャンセル
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  }
  const labels: Record<string, string> = {
    running: "実行中",
    completed: "完了",
    failed: "失敗",
    pending: "待機中",
  }

  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {labels[status] || status}
    </span>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("ja-JP")
}
