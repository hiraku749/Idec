'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { truncate } from '@/lib/utils/format'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import type { Note } from '@/types'

interface SidebarProps {
  recentNotes: Pick<Note, 'id' | 'title'>[]
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '🏠' },
  { href: '/notes',     label: 'ノート',         icon: '📝' },
  { href: '/projects',  label: 'プロジェクト',   icon: '📁' },
  { href: '/agent',     label: 'OwnAI',          icon: '🤖' },
  { href: '/wall',      label: '壁打ち',          icon: '💬' },
]

export function Sidebar({ recentNotes }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r bg-sidebar text-sidebar-foreground">
      {/* ロゴ */}
      <div className="px-4 py-5 border-b">
        <span className="font-bold text-lg tracking-tight">Idec</span>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* 最近のノート */}
        {recentNotes.length > 0 && (
          <div className="pt-4">
            <p className="px-3 mb-1 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              最近のノート
            </p>
            {recentNotes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition-colors"
              >
                <span>📄</span>
                {truncate(note.title || '無題のノート', 18)}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* 設定・テーマ切替・ログアウト */}
      <div className="p-3 border-t space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60',
          )}
        >
          <span>⚙️</span>
          設定
        </Link>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition-colors disabled:opacity-50"
        >
          <span>🚪</span>
          {loggingOut ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    </aside>
  )
}
