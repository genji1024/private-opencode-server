"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

const CONFIG_KEYS = {
  githubToken: "github_token",
  watchedRepos: "watched_repos",
  opencodeModel: "opencode_model",
  opencodeTimeout: "opencode_timeout",
  opencodeExtraArgs: "opencode_extra_args",
} as const

interface Configs {
  [CONFIG_KEYS.githubToken]: string
  [CONFIG_KEYS.watchedRepos]: string[]
  [CONFIG_KEYS.opencodeModel]: string
  [CONFIG_KEYS.opencodeTimeout]: string
  [CONFIG_KEYS.opencodeExtraArgs]: string
}

type Message = { type: "success" | "error" | "info" | "default"; text: string } | null

export default function SettingsPage() {
  const [configs, setConfigs] = React.useState<Configs>({
    [CONFIG_KEYS.githubToken]: "",
    [CONFIG_KEYS.watchedRepos]: [],
    [CONFIG_KEYS.opencodeModel]: "",
    [CONFIG_KEYS.opencodeTimeout]: "300",
    [CONFIG_KEYS.opencodeExtraArgs]: "",
  })
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<Message>(null)
  const [showToken, setShowToken] = React.useState(false)
  const [testingToken, setTestingToken] = React.useState(false)
  const [tokenTestResult, setTokenTestResult] = React.useState<{ success: boolean; login?: string; error?: string } | null>(null)
  const [newRepo, setNewRepo] = React.useState("")

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
        [CONFIG_KEYS.watchedRepos]: [],
        [CONFIG_KEYS.opencodeModel]: "",
        [CONFIG_KEYS.opencodeTimeout]: "300",
        [CONFIG_KEYS.opencodeExtraArgs]: "",
      }
      for (const item of data) {
        if (item.key === CONFIG_KEYS.githubToken) {
          configMap[CONFIG_KEYS.githubToken] = item.value
        } else if (item.key === CONFIG_KEYS.watchedRepos) {
          configMap[CONFIG_KEYS.watchedRepos] = item.value
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean)
        } else if (item.key === CONFIG_KEYS.opencodeModel) {
          configMap[CONFIG_KEYS.opencodeModel] = item.value
        } else if (item.key === CONFIG_KEYS.opencodeTimeout) {
          configMap[CONFIG_KEYS.opencodeTimeout] = item.value
        } else if (item.key === CONFIG_KEYS.opencodeExtraArgs) {
          configMap[CONFIG_KEYS.opencodeExtraArgs] = item.value
        }
      }
      setConfigs(configMap)
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load" })
    } finally {
      setLoading(false)
    }
  }

  async function saveConfig(key: string, value: string) {
    const res = await fetch(`/api/config/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    })
    if (!res.ok) throw new Error(`Failed to save ${key}`)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      setMessage(null)

      await saveConfig(CONFIG_KEYS.githubToken, configs[CONFIG_KEYS.githubToken])
      await saveConfig(CONFIG_KEYS.watchedRepos, configs[CONFIG_KEYS.watchedRepos].join("\n"))
      await saveConfig(CONFIG_KEYS.opencodeModel, configs[CONFIG_KEYS.opencodeModel])
      await saveConfig(CONFIG_KEYS.opencodeTimeout, configs[CONFIG_KEYS.opencodeTimeout])
      await saveConfig(CONFIG_KEYS.opencodeExtraArgs, configs[CONFIG_KEYS.opencodeExtraArgs])

      setMessage({ type: "success", text: "設定を保存しました" })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Save failed" })
    } finally {
      setSaving(false)
    }
  }

  async function handleTestToken() {
    const token = configs[CONFIG_KEYS.githubToken]
    if (!token) {
      setTokenTestResult({ success: false, error: "トークンが入力されていません" })
      return
    }

    try {
      setTestingToken(true)
      setTokenTestResult(null)

      const res = await fetch("/api/settings/test-github-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      setTokenTestResult(data)
    } catch (err) {
      setTokenTestResult({ success: false, error: err instanceof Error ? err.message : "Test failed" })
    } finally {
      setTestingToken(false)
    }
  }

  function addRepo() {
    const repo = newRepo.trim()
    if (!repo) return
    if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
      setMessage({ type: "error", text: "リポジトリ名は「owner/repo」形式で入力してください" })
      return
    }
    if (configs[CONFIG_KEYS.watchedRepos].includes(repo)) {
      setMessage({ type: "info", text: "このリポジトリは既に追加されています" })
      return
    }
    setConfigs((prev) => ({
      ...prev,
      [CONFIG_KEYS.watchedRepos]: [...prev[CONFIG_KEYS.watchedRepos], repo],
    }))
    setNewRepo("")
    setMessage(null)
  }

  function removeRepo(repo: string) {
    setConfigs((prev) => ({
      ...prev,
      [CONFIG_KEYS.watchedRepos]: prev[CONFIG_KEYS.watchedRepos].filter((r) => r !== repo),
    }))
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 md:p-8">
        <div className="max-w-2xl mx-auto text-muted-foreground">読み込み中...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">設定</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            トークン・リポジトリ・opencode の設定を管理
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GitHub トークン管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="githubToken">Personal Access Token</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="githubToken"
                      type={showToken ? "text" : "password"}
                      value={configs[CONFIG_KEYS.githubToken]}
                      onChange={(e) => {
                        setConfigs((prev) => ({ ...prev, [CONFIG_KEYS.githubToken]: e.target.value }))
                        setTokenTestResult(null)
                      }}
                      placeholder="github_pat_..."
                      className="font-mono pr-16"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                    >
                      {showToken ? "隠す" : "表示"}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestToken}
                    disabled={testingToken || !configs[CONFIG_KEYS.githubToken]}
                  >
                    {testingToken ? "テスト中..." : "接続テスト"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  GitHub Personal Access Token（repo スコープが必要）
                </p>

                {tokenTestResult && (
                  <Alert variant={tokenTestResult.success ? "default" : "destructive"}>
                    <AlertDescription>
                      {tokenTestResult.success ? (
                        <>
                          接続成功: <strong>{tokenTestResult.login}</strong> として認証されました
                        </>
                      ) : (
                        <>接続失敗: {tokenTestResult.error}</>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>監視対象リポジトリ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newRepo}
                  onChange={(e) => setNewRepo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRepo() } }}
                  placeholder="owner/repo"
                  className="font-mono"
                />
                <Button type="button" onClick={addRepo} disabled={!newRepo.trim()}>
                  追加
                </Button>
              </div>

              {configs[CONFIG_KEYS.watchedRepos].length === 0 ? (
                <p className="text-sm text-muted-foreground">監視対象リポジトリが設定されていません</p>
              ) : (
                <ul className="space-y-2">
                  {configs[CONFIG_KEYS.watchedRepos].map((repo) => (
                    <li
                      key={repo}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <Badge variant="secondary" className="font-mono">
                        {repo}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRepo(repo)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        削除
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-muted-foreground">
                監視するリポジトリを「owner/repo」形式で入力して追加ボタンをクリック
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OpenCode 設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="opencodeModel">使用モデル</Label>
                <Input
                  id="opencodeModel"
                  type="text"
                  value={configs[CONFIG_KEYS.opencodeModel]}
                  onChange={(e) =>
                    setConfigs((prev) => ({ ...prev, [CONFIG_KEYS.opencodeModel]: e.target.value }))
                  }
                  placeholder="claude-sonnet-4-20250514"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  opencode が使用する AI モデル（空欄の場合はデフォルト）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opencodeTimeout">タイムアウト（秒）</Label>
                <Input
                  id="opencodeTimeout"
                  type="number"
                  value={configs[CONFIG_KEYS.opencodeTimeout]}
                  onChange={(e) =>
                    setConfigs((prev) => ({ ...prev, [CONFIG_KEYS.opencodeTimeout]: e.target.value }))
                  }
                  min="30"
                  max="3600"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  セッションの最大実行時間（30〜3600秒）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opencodeExtraArgs">追加引数</Label>
                <Input
                  id="opencodeExtraArgs"
                  type="text"
                  value={configs[CONFIG_KEYS.opencodeExtraArgs]}
                  onChange={(e) =>
                    setConfigs((prev) => ({ ...prev, [CONFIG_KEYS.opencodeExtraArgs]: e.target.value }))
                  }
                  placeholder="--verbose --temperature 0.7"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  opencode CLI に渡す追加引数（スペース区切り）
                </p>
              </div>
            </CardContent>
          </Card>

          {message && (
            <Alert variant={message.type === "success" ? "default" : message.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "全て保存"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMessage(null)
                setTokenTestResult(null)
                fetchConfigs()
              }}
            >
              リセット
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
