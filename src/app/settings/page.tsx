"use client"

import React from "react"

const CONFIG_KEYS = {
  githubToken: "github_token",
  watchedRepos: "watched_repos",
} as const

interface Configs {
  [CONFIG_KEYS.githubToken]: string
  [CONFIG_KEYS.watchedRepos]: string
}

export default function SettingsPage() {
  const [configs, setConfigs] = React.useState<Configs>({
    [CONFIG_KEYS.githubToken]: "",
    [CONFIG_KEYS.watchedRepos]: "",
  })
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  React.useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    try {
      setLoading(true)
      const res = await fetch("/api/config")
      if (!res.ok) throw new Error("Failed to fetch configs")
      const data = await res.json() as { key: string; value: string }[]
      const configMap: Configs = {
        [CONFIG_KEYS.githubToken]: "",
        [CONFIG_KEYS.watchedRepos]: "",
      }
      for (const item of data) {
        if (item.key === CONFIG_KEYS.githubToken) {
          configMap[CONFIG_KEYS.githubToken] = item.value
        } else if (item.key === CONFIG_KEYS.watchedRepos) {
          configMap[CONFIG_KEYS.watchedRepos] = item.value
        }
      }
      setConfigs(configMap)
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      setMessage(null)

      for (const [key, value] of Object.entries(configs)) {
        const res = await fetch(`/api/config/${encodeURIComponent(key)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        })
        if (!res.ok) throw new Error(`Failed to save ${key}`)
      }

      setMessage({ type: "success", text: "設定を保存しました" })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Save failed" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-gray-500">読み込み中...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">設定</h1>

        <form onSubmit={handleSave} className="bg-white border rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub トークン
            </label>
            <input
              type="password"
              value={configs[CONFIG_KEYS.githubToken]}
              onChange={(e) =>
                setConfigs((prev) => ({ ...prev, [CONFIG_KEYS.githubToken]: e.target.value }))
              }
              placeholder="ghp_..."
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              GitHub Personal Access Token（opencode が使用）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              監視対象リポジトリ
            </label>
            <textarea
              value={configs[CONFIG_KEYS.watchedRepos]}
              onChange={(e) =>
                setConfigs((prev) => ({ ...prev, [CONFIG_KEYS.watchedRepos]: e.target.value }))
              }
              placeholder="genji1024/private-note"
              rows={3}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              監視するリポジトリを1行に1つずつ入力
            </p>
          </div>

          {message && (
            <div
              className={`p-3 rounded text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </form>
      </div>
    </main>
  )
}
