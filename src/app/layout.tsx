import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "OpenCode Server",
  description: "OpenCode ヘッドレスサーバー管理",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
