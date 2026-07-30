'use client'

import React from 'react'

const CONFIG_KEYS = {
  githubToken: 'github_token',
  watchedRepos: 'watched_repos',
  opencodeModel: 'opencode_model',
  opencodeTimeout: 'opencode_timeout',
  opencodeExtraArgs: 'opencode_extra_args',
} as const

interface Configs {
  [CONFIG_KEYS.githubToken]: string
  [CONFIG_KEYS.watchedRepos]: string[]
  [CONFIG_KEYS.opencodeModel]: string
  [CONFIG_KEYS.opencodeTimeout]: string
  [CONFIG_KEYS.opencodeExtraArgs]: string
}

type Message = { type: 'success' | 'error' | 'info'; text: string } | null

export default function SettingsPage() {
  const [configs, setConfigs] = React.useState<Configs>({
    [CONFIG_KEYS.githubToken]: '',
    [CONFIG_KEYS.watchedRepos]: [],
    [CONFIG_KEYS.opencodeModel]: '',
    [CONFIG_KEYS.opencodeTimeout]: '300',
    [CONFIG_KEYS.opencodeExtraArgs]: '',
  })
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<Message>(null)
  const [showToken, setShowToken] = React.useState(false)
  const [testingToken, setTestingToken] = React.useState(false)
  const [tokenTestResult, setTokenTestResult] = React.useState<{
    success: boolean
    login?: string
    error?: string
  } | null>(null)
  const [newRepo, setNewRepo] = React.useState('')

  React.useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    try {
      setLoading(true)
      const res = await fetch('/api/config')
      if (!res.ok) throw new Error('Failed to fetch configs')
      const data = (await res.json()) as { key: string; value: string }[]
      const configMap: Configs = {
        [CONFIG_KEYS.githubToken]: '',
        [CONFIG_KEYS.watchedRepos]: [],
        [CONFIG_KEYS.opencodeModel]: '',
        [CONFIG_KEYS.opencodeTimeout]: '300',
        [CONFIG_KEYS.opencodeExtraArgs]: '',
      }
      for (const item of data) {
        if (item.key === CONFIG_KEYS.githubToken) {
          configMap[CONFIG_KEYS.githubToken] = item.value
        } else if (item.key === CONFIG_KEYS.watchedRepos) {
          configMap[CONFIG_KEYS.watchedRepos] = item.value
            .split('\n')
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
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load' })
    } finally {
      setLoading(false)
    }
  }

  async function saveConfig(key: string, value: string) {
    const res = await fetch(`/api/config/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
      await saveConfig(CONFIG_KEYS.watchedRepos, configs[CONFIG_KEYS.watchedRepos].join('\n'))
      await saveConfig(CONFIG_KEYS.opencodeModel, configs[CONFIG_KEYS.opencodeModel])
      await saveConfig(CONFIG_KEYS.opencodeTimeout, configs[CONFIG_KEYS.opencodeTimeout])
      await saveConfig(CONFIG_KEYS.opencodeExtraArgs, configs[CONFIG_KEYS.opencodeExtraArgs])

      setMessage({ type: 'success', text: '設定を保存しました' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  async function handleTestToken() {
    const token = configs[CONFIG_KEYS.githubToken]
    if (!token) {
      setTokenTestResult({ success: false, error: 'トークンが入力されていません' })
      return
    }

    try {
      setTestingToken(true)
      setTokenTestResult(null)

      const res = await fetch('/api/settings/test-github-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      setTokenTestResult(data)
    } catch (err) {
      setTokenTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Test failed',
      })
    } finally {
      setTestingToken(false)
    }
  }

  function addRepo() {
    const repo = newRepo.trim()
    if (!repo) return
    if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
      setMessage({ type: 'error', text: 'リポジトリ名は「owner/repo」形式で入力してください' })
      return
    }
    if (configs[CONFIG_KEYS.watchedRepos].includes(repo)) {
      setMessage({ type: 'info', text: 'このリポジトリは既に追加されています' })
      return
    }
    setConfigs((prev) => ({
      ...prev,
      [CONFIG_KEYS.watchedRepos]: [...prev[CONFIG_KEYS.watchedRepos], repo],
    }))
    setNewRepo('')
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
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-gray-500">読み込み中...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">設定</h1>

        <form onSubmit={handleSave} className="space-y-6">
          {/* GitHub Token */}
          <section className="bg-white border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">GitHub トークン管理</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Access Token
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={configs[CONFIG_KEYS.githubToken]}
                    onChange={(e) => {
                      setConfigs((prev) => ({ ...prev, [CONFIG_KEYS.githubToken]: e.target.value }))
                      setTokenTestResult(null)
                    }}
                    placeholder="github_pat_..."
                    className="w-full border rounded-lg p-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    {showToken ? '隠す' : '表示'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleTestToken}
                  disabled={testingToken || !configs[CONFIG_KEYS.githubToken]}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {testingToken ? 'テスト中...' : '接続テスト'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                GitHub Personal Access Token（repo スコープが必要）
              </p>

              {tokenTestResult && (
                <div
                  className={`p-3 rounded text-sm ${
                    tokenTestResult.success
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {tokenTestResult.success ? (
                    <>
                      接続成功: <strong>{tokenTestResult.login}</strong> として認証されました
                    </>
                  ) : (
                    <>接続失敗: {tokenTestResult.error}</>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Watched Repositories */}
          <section className="bg-white border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">監視対象リポジトリ</h2>

            <div className="flex gap-2">
              <input
                type="text"
                value={newRepo}
                onChange={(e) => setNewRepo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addRepo()
                  }
                }}
                placeholder="owner/repo"
                className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={addRepo}
                disabled={!newRepo.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                追加
              </button>
            </div>

            {configs[CONFIG_KEYS.watchedRepos].length === 0 ? (
              <p className="text-sm text-gray-400">監視対象リポジトリが設定されていません</p>
            ) : (
              <ul className="space-y-2">
                {configs[CONFIG_KEYS.watchedRepos].map((repo) => (
                  <li
                    key={repo}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-mono">{repo}</span>
                    <button
                      type="button"
                      onClick={() => removeRepo(repo)}
                      className="text-red-500 hover:text-red-700 text-sm transition-colors"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-gray-500">
              監視するリポジトリを「owner/repo」形式で入力して追加ボタンをクリック
            </p>
          </section>

          {/* OpenCode Settings */}
          <section className="bg-white border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">OpenCode 設定</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">使用モデル</label>
              <input
                type="text"
                value={configs[CONFIG_KEYS.opencodeModel]}
                onChange={(e) =>
                  setConfigs((prev) => ({ ...prev, [CONFIG_KEYS.opencodeModel]: e.target.value }))
                }
                placeholder="claude-sonnet-4-20250514"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                opencode が使用する AI モデル（空欄の場合はデフォルト）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイムアウト（秒）
              </label>
              <input
                type="number"
                value={configs[CONFIG_KEYS.opencodeTimeout]}
                onChange={(e) =>
                  setConfigs((prev) => ({ ...prev, [CONFIG_KEYS.opencodeTimeout]: e.target.value }))
                }
                min="30"
                max="3600"
                className="w-32 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">セッションの最大実行時間（30〜3600秒）</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">追加引数</label>
              <input
                type="text"
                value={configs[CONFIG_KEYS.opencodeExtraArgs]}
                onChange={(e) =>
                  setConfigs((prev) => ({
                    ...prev,
                    [CONFIG_KEYS.opencodeExtraArgs]: e.target.value,
                  }))
                }
                placeholder="--verbose --temperature 0.7"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                opencode CLI に渡す追加引数（スペース区切り）
              </p>
            </div>
          </section>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg text-sm border ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : message.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Save */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '保存中...' : '全て保存'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMessage(null)
                setTokenTestResult(null)
                fetchConfigs()
              }}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              リセット
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
