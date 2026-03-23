'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  LayoutDashboard,
  FileText,
  FolderKanban,
  Bot,
  MessageSquare,
  Package,
  Wand2,
  Code2,
  GitBranch,
  Map,
  Mic,
  MessageSquareX,
  Cpu,
  Users,
  BarChart3,
  Link2,
  Combine,
  FlaskConical,
  Timer,
  Network,
  Settings,
  Zap,
  FilePlus,
  FolderPlus,
  FileEdit,
} from 'lucide-react'

// ─── 型定義 ───────────────────────────────────────────

interface CommandItem {
  id: string
  label: string
  icon: React.ElementType
  shortcut?: string
  action: () => void
  section: string
}

interface NoteResult {
  id: string
  title: string | null
}

// ─── ナビゲーション定義 ─────────────────────────────────

const NAV_ITEMS: Omit<CommandItem, 'action'>[] = [
  { id: 'nav-dashboard',   label: 'ホーム',              icon: LayoutDashboard, section: 'ページ移動' },
  { id: 'nav-notes',       label: 'ノート',              icon: FileText,        section: 'ページ移動' },
  { id: 'nav-projects',    label: 'プロジェクト',        icon: FolderKanban,    section: 'ページ移動' },
  { id: 'nav-agent',       label: 'OwnAI',               icon: Bot,             section: 'ページ移動' },
  { id: 'nav-wall',        label: 'ブレスト',             icon: MessageSquare,   section: 'ページ移動' },
  { id: 'nav-packs',       label: 'ナレッジパック',      icon: Package,         section: 'ページ移動' },
  { id: 'nav-enhance',     label: 'ブースト',            icon: Wand2,           section: 'ページ移動' },
  { id: 'nav-context',     label: '文脈設計',            icon: Code2,           section: 'ページ移動' },
  { id: 'nav-diagram',     label: '図解',                icon: GitBranch,       section: 'ページ移動' },
  { id: 'nav-roadmap',     label: '戦略マップ',          icon: Map,             section: 'ページ移動' },
  { id: 'nav-voice-box',   label: 'ボイスメモ',          icon: Mic,             section: 'ページ移動' },
  { id: 'nav-opponent',    label: '論客',                icon: MessageSquareX,  section: 'ページ移動' },
  { id: 'nav-simulator',   label: 'シミュレーター',      icon: Cpu,             section: 'ページ移動' },
  { id: 'nav-discussion',  label: '議論室',              icon: Users,           section: 'ページ移動' },
  { id: 'nav-scoring',     label: 'スコアリング',        icon: BarChart3,       section: 'ページ移動' },
  { id: 'nav-note-links',  label: 'リンク',              icon: Link2,           section: 'ページ移動' },
  { id: 'nav-synthesis',   label: '統合',                icon: Combine,         section: 'ページ移動' },
  { id: 'nav-swot',        label: '戦略分析',            icon: FlaskConical,    section: 'ページ移動' },
  { id: 'nav-incubator',   label: 'インキュベーター',    icon: Timer,           section: 'ページ移動' },
  { id: 'nav-graph',       label: 'グラフ',              icon: Network,         section: 'ページ移動' },
  { id: 'nav-settings',    label: '設定',                icon: Settings,        section: 'ページ移動' },
]

const NAV_HREF_MAP: Record<string, string> = {
  'nav-dashboard':  '/dashboard',
  'nav-notes':      '/notes',
  'nav-projects':   '/projects',
  'nav-agent':      '/agent',
  'nav-wall':       '/wall',
  'nav-packs':      '/packs',
  'nav-enhance':    '/enhance',
  'nav-context':    '/context',
  'nav-diagram':    '/diagram',
  'nav-roadmap':    '/roadmap',
  'nav-voice-box':  '/voice-box',
  'nav-opponent':   '/opponent',
  'nav-simulator':  '/simulator',
  'nav-discussion': '/discussion',
  'nav-scoring':    '/scoring',
  'nav-note-links': '/note-links',
  'nav-synthesis':  '/synthesis',
  'nav-swot':       '/swot',
  'nav-incubator':  '/incubator',
  'nav-graph':      '/graph',
  'nav-settings':   '/settings',
}

// ─── ファジーマッチ ─────────────────────────────────────

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++
  }
  return qi === q.length
}

// ─── コンポーネント ─────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [noteResults, setNoteResults] = useState<NoteResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // モーダルを開く
  const handleOpen = useCallback(() => {
    setOpen(true)
    setQuery('')
    setSelectedIndex(0)
    setNoteResults([])
  }, [])

  // モーダルを閉じる
  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  // グローバルキーボードショートカット: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) {
          handleClose()
        } else {
          handleOpen()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleOpen, handleClose, open])

  // モーダルが開いたら入力にフォーカス
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // ノート検索（デバウンス300ms）
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!open) return

    if (!query.trim()) {
      setNoteResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/notes?search=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data: NoteResult[] = await res.json()
          setNoteResults(data.slice(0, 5))
        }
      } catch {
        // 検索エラーは黙殺
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, open])

  // アクションアイテムの定義
  const actionItems: CommandItem[] = useMemo(() => [
    {
      id: 'action-quick-capture',
      label: 'クイックキャプチャ',
      icon: Zap,
      shortcut: '⌘⇧N',
      section: 'アクション',
      action: () => {
        handleClose()
        // クイックキャプチャのキーボードイベントを発火
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'n',
          metaKey: true,
          shiftKey: true,
          bubbles: true,
        }))
      },
    },
    {
      id: 'action-new-note',
      label: '新しいノート',
      icon: FilePlus,
      section: 'アクション',
      action: () => {
        handleClose()
        router.push('/notes/new')
      },
    },
    {
      id: 'action-new-project',
      label: '新しいプロジェクト',
      icon: FolderPlus,
      section: 'アクション',
      action: () => {
        handleClose()
        router.push('/projects/new')
      },
    },
    {
      id: 'action-settings',
      label: '設定を開く',
      icon: Settings,
      shortcut: '',
      section: 'アクション',
      action: () => {
        handleClose()
        router.push('/settings')
      },
    },
  ], [handleClose, router])

  // ナビゲーションアイテムをCommandItemに変換
  const navCommandItems: CommandItem[] = useMemo(() =>
    NAV_ITEMS.map((item) => ({
      ...item,
      action: () => {
        handleClose()
        const href = NAV_HREF_MAP[item.id]
        if (href) router.push(href)
      },
    })),
    [handleClose, router],
  )

  // ノート結果をCommandItemに変換
  const noteCommandItems: CommandItem[] = useMemo(() =>
    noteResults.map((note) => ({
      id: `note-${note.id}`,
      label: note.title || '無題のノート',
      icon: FileEdit,
      section: '最近のノート',
      action: () => {
        handleClose()
        router.push(`/notes/${note.id}`)
      },
    })),
    [noteResults, handleClose, router],
  )

  // フィルタリング
  const filteredItems = useMemo(() => {
    const all = [...noteCommandItems, ...navCommandItems, ...actionItems]
    if (!query.trim()) {
      // クエリが空の場合はナビゲーションとアクションのみ表示
      return [...navCommandItems, ...actionItems]
    }
    return all.filter((item) => fuzzyMatch(item.label, query.trim()))
  }, [query, noteCommandItems, navCommandItems, actionItems])

  // セクション別にグループ化
  const groupedItems = useMemo(() => {
    const sections: { title: string; items: CommandItem[] }[] = []
    const sectionOrder = ['最近のノート', 'ページ移動', 'アクション']

    for (const sectionTitle of sectionOrder) {
      const items = filteredItems.filter((item) => item.section === sectionTitle)
      if (items.length > 0) {
        sections.push({ title: sectionTitle, items })
      }
    }
    return sections
  }, [filteredItems])

  // フラット化したアイテムリスト（キーボードナビゲーション用）
  const flatItems = useMemo(() =>
    groupedItems.flatMap((g) => g.items),
    [groupedItems],
  )

  // 選択インデックスをリセット
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // 選択アイテムが見えるようにスクロール
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector('[data-selected="true"]')
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // キーボードナビゲーション
  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(flatItems.length, 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(flatItems.length, 1))
        break
      case 'Enter':
        e.preventDefault()
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action()
        }
        break
      case 'Escape':
        e.preventDefault()
        handleClose()
        break
    }
  }

  // アイテムのグローバルインデックスを計算
  function getGlobalIndex(sectionIdx: number, itemIdx: number): number {
    let offset = 0
    for (let i = 0; i < sectionIdx; i++) {
      offset += groupedItems[i].items.length
    }
    return offset + itemIdx
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* パレット本体 */}
      <div
        className="relative w-full max-w-lg bg-background border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* 検索入力 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 shrink-0 text-muted-foreground/60" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ページやアクションを検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-base bg-transparent border-0 outline-none placeholder:text-muted-foreground/50"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 bg-muted/30">
            ESC
          </kbd>
        </div>

        {/* アイテムリスト */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
          {flatItems.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground/60">
              {searching ? '検索中...' : '一致する結果がありません'}
            </div>
          )}

          {groupedItems.map((section, sectionIdx) => (
            <div key={section.title}>
              {/* セクションヘッダー */}
              <div className="px-4 pt-2 pb-1">
                <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>

              {/* アイテム */}
              {section.items.map((item, itemIdx) => {
                const globalIdx = getGlobalIndex(sectionIdx, itemIdx)
                const isSelected = globalIdx === selectedIndex
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground/80 hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-60" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-[11px] text-muted-foreground/50 font-mono">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* フッター */}
        <div className="flex items-center gap-4 px-4 py-2 border-t text-[11px] text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1 py-0.5 bg-muted/30 font-mono">↑↓</kbd>
            移動
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1 py-0.5 bg-muted/30 font-mono">↵</kbd>
            実行
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1 py-0.5 bg-muted/30 font-mono">esc</kbd>
            閉じる
          </span>
        </div>
      </div>
    </div>
  )
}
