import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'
import { Toaster } from 'sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'OpenCode Server',
  description: 'OpenCode ヘッドレスサーバー管理',
}

const navItems = [
  { href: '/', label: 'ダッシュボード' },
  { href: '/opencode', label: 'Web UI' },
  { href: '/sessions', label: 'セッション' },
  { href: '/sessions/new', label: '新規セッション' },
  { href: '/settings', label: '設定' },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={cn('font-sans', geist.variable)}>
      <body>
        <div className="flex min-h-screen">
          <aside
            className="w-56 flex flex-col shrink-0"
            style={{
              backgroundColor: 'var(--sidebar)',
              borderRight: '1px solid var(--sidebar-border)',
            }}
          >
            <Link
              href="/"
              className="flex items-center gap-2.5 px-5 py-5 border-b font-bold text-base tracking-tight"
              style={{
                borderColor: 'var(--sidebar-border)',
                color: 'var(--sidebar-foreground)',
              }}
            >
              <Pencil size={20} style={{ color: 'var(--sidebar-primary)' }} />
              <span>OpenCode Server</span>
            </Link>
            <nav className="flex flex-col gap-0.5 p-3">
              {navItems.map((item) => (
                <SideNavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
            <div className="mt-auto px-5 py-4 text-xs" style={{ color: 'var(--sidebar-border)' }}>
              v0.1.0
            </div>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}

function SideNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="sidebar-nav-link text-sm font-medium transition-all duration-150 px-3 py-2 rounded-md"
      style={{
        color: 'var(--sidebar-foreground)',
        opacity: 0.65,
      }}
    >
      {label}
    </Link>
  )
}
