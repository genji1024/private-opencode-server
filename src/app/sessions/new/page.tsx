"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewSessionPage() {
  const router = useRouter()

  const [repo, setRepo] = React.useState("genji1024/private-note")
  const [instruction, setInstruction] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!repo.trim() || !instruction.trim()) return

    try {
      setSubmitting(true)
      setError(null)
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, instruction }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create session")
      }

      const session = await res.json()
      router.push(`/sessions/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/sessions" className={buttonVariants({ variant: "link", className: "mb-4 -ml-2" })}>
          ← 一覧に戻る
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>新規セッション作成</CardTitle>
            <CardDescription>opencode に実行させるタスクを定義します</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="repo">リポジトリ</Label>
                <Input
                  id="repo"
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="owner/repo"
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instruction">指示文</Label>
                <Textarea
                  id="instruction"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="opencode に実行させる指示を入力..."
                  rows={5}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "作成中..." : "作成"}
                </Button>
                <Link href="/sessions" className={buttonVariants({ variant: "outline" })}>
                  キャンセル
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
