'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { truncate } from '@/lib/utils/format'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import {
  FileText,
  FolderKanban,
  Bot,
  Settings,
  LogOut,
  FileEdit,
  Wand2,
  Code2,
  GitBranch,
  Map,
  MessageSquareX,
  Cpu,
  BarChart3,
  Link2,
  Combine,
  FlaskConical,
  Timer,
  Network,
  ChevronDown,
  ChevronRight,
  Zap,
  X,
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Users,
} from 'lucide-react'
import type { Note, NoteTag } from '@/types'
import { useActiveProject } from '@/lib/hooks/use-active-project'

interface SidebarProps {
  recentNotes: Pick<Note, 'id' | 'title'>[]
}

const MAIN_ITEMS = [
  { href: '/dashboard',  label: 'ホーム',        icon: LayoutDashboard },
  { href: '/notes',      label: 'ノート',        icon: FileText },
  { href: '/projects',   label: 'プロジェクト',  icon: FolderKanban },
  { href: '/agent',      label: 'OwnAI',         icon: Bot },
  { href: '/wall',       label: '壁打ち',        icon: MessageSquare },
]

const TOOL_ITEMS = [
  { href: '/enhance',  label: '文章増強',              icon: Wand2 },
  { href: '/context',  label: 'コンテキスト',           icon: Code2 },
  { href: '/diagram',  label: '図式生成',               icon: GitBranch },
  { href: '/roadmap',  label: 'ロードマップ作成',        icon: Map },
]

const LAB_ITEMS = [
  { href: '/opponent',    label: 'AI反対者',            icon: MessageSquareX },
  { href: '/simulator',   label: 'AIシミュレーター',     icon: Cpu },
  { href: '/discussion',  label: 'ディスカッション',     icon: Users },
  { href: '/scoring',     label: 'アイデアスコアリング', icon: BarChart3 },
  { href: '/note-links',  label: 'ノートリンク',        icon: Link2 },
  { href: '/synthesis',   label: 'アイデア結合',        icon: Combine },
  { href: '/swot',        label: '分析ジェネレーター',  icon: FlaskConical },
  { href: '/incubator',   label: 'インキュベーター',    icon: Timer },
  { href: '/graph',       label: 'ナレッジグラフ',      icon: Network },
]

const PREVIEW_COUNT = 3
const QUICK_CAPTURE_TAGS: NoteTag[] = ['アイデア', '情報', 'ToDo']

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
  small = false,
}: {
  href: string
  label: string
  icon: React.ElementType
  pathname: string
  small?: boolean
}) {
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 transition-all duration-150',
        small ? 'py-1.5 text-xs' : 'py-2 text-sm',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:translate-x-0.5',
      )}
    >
      <Icon className={cn('shrink-0', small ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      {label}
    </Link>
  )
}

function CollapsibleSection({
  label,
  items,
  pathname,
}: {
  label: string
  items: { href: string; label: string; icon: React.ElementType }[]
  pathname: string
}) {
  const hasActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  const [expanded, setExpanded] = useState(hasActive)
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT)
  const hiddenCount = items.length - PREVIEW_COUNT

  return (
    <div className="pt-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full px-3 mb-1 group"
      >
        <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
          {label}
        </span>
        <span className="flex items-center gap-1 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors">
          {!expanded && hiddenCount > 0 && (
            <span className="text-[10px]">+{hiddenCount}</span>
          )}
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </span>
      </button>
      {visible.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          pathname={pathname}
          small
        />
      ))}
    </div>
  )
}

function QuickCaptureButton() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [tag, setTag] = useState<NoteTag>('アイデア')
  const [saving, setSaving] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { activeProject } = useActiveProject()

  const handleOpen = useCallback(() => {
    setOpen(true)
    setTitle('')
    setMemo('')
    setTag('アイデア')
  }, [])

  const handleClose = useCallback(() => {
    if (!saving) setOpen(false)
  }, [saving])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'n') {
        e.preventDefault()
        handleOpen()
      }
      if (e.key === 'Escape' && open) handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleOpen, handleClose, open])

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100)
  }, [open])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: memo.trim() ? [{ type: 'text', text: memo.trim() }] : [],
          },
        ],
      }
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content,
          tag,
          ...(activeProject ? { project_id: activeProject.id } : {}),
        }),
      })
      if (res.ok) {
        setOpen(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void handleSave()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition-all duration-150"
      >
        <Zap className="w-4 h-4 shrink-0 text-amber-500" />
        クイックキャプチャ
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div
            className="relative w-full max-w-lg bg-background border rounded-xl shadow-2xl p-5 animate-fade-in-up"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="w-4 h-4 text-amber-500" />
                クイックキャプチャ
              </div>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={titleRef}
              type="text"
              placeholder="アイデアのタイトル..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-medium bg-transparent border-0 border-b border-border pb-2 mb-3 outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
            />
            <textarea
              placeholder="メモ（任意）"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="w-full text-sm bg-transparent border rounded-md p-2 mb-3 outline-none resize-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            />
            <div className="flex items-center gap-2 mb-4">
              {QUICK_CAPTURE_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    tag === t
                      ? 'bg-foreground text-background border-foreground'
                      : 'text-muted-foreground border-border hover:border-foreground/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {activeProject && (
              <div className="flex items-center gap-1.5 mb-3 text-xs text-primary bg-primary/5 border border-primary/20 rounded-md px-2 py-1.5">
                <BookOpen className="w-3 h-3 shrink-0" />
                <span className="truncate">{activeProject.title} に保存されます</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                ⌘+Enter で保存 / Esc で閉じる
              </span>
              <button
                onClick={() => void handleSave()}
                disabled={!title.trim() || saving}
                className="text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function Sidebar({ recentNotes }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const { activeProject, setActiveProject } = useActiveProject()

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

      {/* アクティブプロジェクト */}
      {activeProject && (
        <div className="px-3 py-2 border-b bg-primary/5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <BookOpen className="w-3 h-3 shrink-0 text-primary" />
              <span className="text-[11px] text-primary font-medium truncate">
                {activeProject.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveProject(null)}
              className="text-[10px] text-primary/60 hover:text-primary shrink-0 transition-colors"
            >
              解除
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 pl-4">ナレッジ使用中</p>
        </div>
      )}

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">

        {/* メインプレイス */}
        {MAIN_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            pathname={pathname}
          />
        ))}

        {/* ツール */}
        <CollapsibleSection
          label="ツール"
          items={TOOL_ITEMS}
          pathname={pathname}
        />

        {/* ラボ */}
        <CollapsibleSection
          label="ラボ"
          items={LAB_ITEMS}
          pathname={pathname}
        />

        {/* 最近のノート */}
        {recentNotes.length > 0 && (
          <div className="pt-3">
            <p className="px-3 mb-1 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              最近のノート
            </p>
            {recentNotes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition-all duration-150 hover:translate-x-0.5"
              >
                <FileEdit className="w-3.5 h-3.5 shrink-0 opacity-50" />
                {truncate(note.title || '無題のノート', 18)}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* 設定・クイックキャプチャ・テーマ・ログアウト */}
      <div className="p-3 border-t space-y-0.5">
        <QuickCaptureButton />
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150',
            pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60',
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          設定
        </Link>
        <ThemeToggle />
        <button
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition-all duration-150 disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {loggingOut ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    </aside>
  )
}
