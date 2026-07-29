import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"
import { Geist } from "next/font/google"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "OpenCode Server",
  description: "OpenCode ヘッドレスサーバー管理",
}

const navItems = [
  { href: "/", label: "ダッシュボード" },
  { href: "/opencode", label: "Web UI" },
  { href: "/sessions", label: "セッション" },
  { href: "/sessions/new", label: "新規セッション" },
  { href: "/settings", label: "設定" },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={cn("font-sans", geist.variable)}>
      <body>
        <div className="flex min-h-screen">
          <aside className="w-56 border-r bg-background flex flex-col shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-4 border-b font-bold text-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 20h9" />
                <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
              </svg>
              OpenCode Server
            </Link>
            <nav className="flex flex-col gap-1 p-3">
              {navItems.map((item) => (
                <SideNavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  )
}

function SideNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent"
    >
      {label}
    </Link>
  )
}
