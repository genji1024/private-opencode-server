'use client'

import Link from 'next/link'
import React from 'react'
import { SessionRow } from '@/lib/store'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, LayoutGrid, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export default function SessionsPage() {
  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">セッション一覧</h1>
            <p className="mt-1 text-sm text-muted-foreground">実行中および過去のセッションを管理</p>
          </div>
          <Link href="/sessions/new" className={buttonVariants()}>
            <Plus className="size-4 mr-1" />
            新規セッション
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
  const [cancelTarget, setCancelTarget] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const PAGE_SIZE = 20

  const totalPages = React.useMemo(
    () => Math.max(1, Math.ceil(sessions.length / PAGE_SIZE)),
    [sessions],
  )

  const paginatedSessions = React.useMemo(
    () => sessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sessions, page],
  )

  React.useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    try {
      setLoading(true)
      const res = await fetch('/api/sessions')
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
      setSessions(data)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return
    try {
      const res = await fetch(`/api/sessions/${cancelTarget}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to cancel session')
      toast.success('セッションをキャンセルしました')
      setCancelTarget(null)
      fetchSessions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'キャンセルに失敗しました')
      setCancelTarget(null)
    }
  }

  if (loading) {
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
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12 text-center text-destructive">エラー: {error}</CardContent>
      </Card>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mb-4 text-4xl text-muted-foreground/30">
            <LayoutGrid size={48} strokeWidth={1} className="mx-auto" />
          </div>
          <p className="text-lg mb-2 text-muted-foreground">セッションがありません</p>
          <p className="text-sm text-muted-foreground/60 mb-6">
            最初の opencode セッションを作成しましょう
          </p>
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            セッションを作成
            <ArrowRight className="size-3.5" />
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
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
              {paginatedSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-mono text-sm">{session.id.slice(0, 8)}...</TableCell>
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
                        className={buttonVariants({ variant: 'link', size: 'sm' })}
                      >
                        詳細
                      </Link>
                      {session.status === 'running' && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setCancelTarget(session.id)}
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
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink isActive={page === p} onClick={() => setPage(p)}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>セッションをキャンセル</AlertDialogTitle>
            <AlertDialogDescription>
              このセッションをキャンセルしますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>確認</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    running: 'default',
    completed: 'secondary',
    failed: 'destructive',
    pending: 'outline',
  }
  const labels: Record<string, string> = {
    running: '実行中',
    completed: '完了',
    failed: '失敗',
    pending: '待機中',
  }

  return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ja-JP')
}
