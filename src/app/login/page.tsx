"use client"

import { useRouter } from "next/navigation"
import { useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(false)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        body: formData,
        redirect: "manual",
      })
      if (res.status === 0 || res.type === "opaqueredirect" || res.ok) {
        window.location.href = "/"
        return
      }
      setError(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/50">
      <div className="mb-8 text-center">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight">OpenCode Server</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理画面にアクセス</p>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg">ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="admin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">
                ユーザー名またはパスワードが正しくありません
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
