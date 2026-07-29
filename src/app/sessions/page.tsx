"use client"

import Link from "next/link"
import React from "react"
import { SessionRow } from "@/lib/store"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function SessionsPage() {
  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">セッション一覧</h1>
          <Link href="/sessions/new" className={buttonVariants()}>
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
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          読み込み中...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12 text-center text-destructive">
          エラー: {error}
        </CardContent>
      </Card>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg mb-4 text-muted-foreground">セッションがありません</p>
          <Link href="/sessions/new" className="text-primary hover:underline text-sm font-medium">
            最初のセッションを作成する
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">ID</TableHead>
              <TableHead>リポジトリ</TableHead>
              <TableHead className="w-[120px]">ステータス</TableHead>
              <TableHead className="w-[180px]">開始時刻</TableHead>
              <TableHead className="w-[150px]">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-mono text-sm">
                  {session.id.slice(0, 8)}...
                </TableCell>
                <TableCell>{session.repo}</TableCell>
                <TableCell>
                  <StatusBadge status={session.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(session.startedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link
                      href={`/sessions/${session.id}`}
                      className={buttonVariants({ variant: "link", size: "sm" })}
                    >
                      詳細
                    </Link>
                    {session.status === "running" && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleCancel(session.id)}
                      >
                        キャンセル
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    running: "default",
    completed: "secondary",
    failed: "destructive",
    pending: "outline",
  }
  const labels: Record<string, string> = {
    running: "実行中",
    completed: "完了",
    failed: "失敗",
    pending: "待機中",
  }

  return (
    <Badge variant={variants[status] || "outline"}>
      {labels[status] || status}
    </Badge>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("ja-JP")
}
