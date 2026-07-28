import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">OpenCode Server</h1>
      <p className="text-lg text-gray-600 mb-8">
        OpenCode ヘッドレスサーバーの管理ダッシュボード
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
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
          href="/settings"
          className="rounded-lg border p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">設定 &rarr;</h2>
          <p className="text-sm text-gray-500">
            トークン・リポジトリ設定の管理
          </p>
        </Link>
        <div className="rounded-lg border p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">ステータス</h2>
          <p className="text-sm text-gray-500">
            opencode serve: 未接続
          </p>
        </div>
      </div>
    </main>
  )
}
