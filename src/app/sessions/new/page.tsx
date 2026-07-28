export default function NewSessionPage() {
  return <NewSessionForm />
}

import React from "react"
import { useRouter } from "next/navigation"

function NewSessionForm() {
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
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <a
          href="/sessions"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← 一覧に戻る
        </a>

        <h1 className="text-2xl font-bold mb-6">新規セッション作成</h1>

        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              リポジトリ
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo"
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              指示文
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="opencode に実行させる指示を入力..."
              rows={5}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "作成中..." : "作成"}
            </button>
            <a
              href="/sessions"
              className="px-6 py-2 border rounded hover:bg-gray-50 transition-colors text-center"
            >
              キャンセル
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}
