import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenCode Server',
  description: 'OpenCode ヘッドレスサーバー管理',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>
        <nav className="border-b bg-gray-50 px-6 py-3">
          <div className="flex items-center gap-6 max-w-6xl mx-auto">
            <Link href="/" className="font-bold text-lg">
              OpenCode Server
            </Link>
            <Link href="/opencode" className="text-sm text-purple-700 hover:underline">
              Web UI
            </Link>
            <Link href="/sessions" className="text-sm text-gray-600 hover:underline">
              セッション
            </Link>
            <Link href="/sessions/new" className="text-sm text-gray-600 hover:underline">
              新規
            </Link>
            <Link href="/settings" className="text-sm text-gray-600 hover:underline">
              設定
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
