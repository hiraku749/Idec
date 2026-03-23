'use client'

import { useEffect, useState, useCallback } from 'react'
import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Shortcut {
  keys: string[]
  label: string
}

interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'ナビゲーション',
    shortcuts: [
      { keys: ['⌘', 'K'], label: 'コマンドパレット' },
      { keys: ['⌘', '/'], label: 'ショートカット一覧' },
      { keys: ['⌘', '⇧', 'N'], label: 'クイックキャプチャ' },
    ],
  },
  {
    title: 'エディタ',
    shortcuts: [
      { keys: ['⌘', 'B'], label: '太字' },
      { keys: ['⌘', 'I'], label: 'イタリック' },
      { keys: ['⌘', 'U'], label: '下線' },
      { keys: ['⌘', 'E'], label: 'インラインコード' },
      { keys: ['⌘', '⇧', 'X'], label: '取り消し線' },
      { keys: ['⌘', 'Z'], label: '元に戻す' },
      { keys: ['⌘', '⇧', 'Z'], label: 'やり直し' },
    ],
  },
  {
    title: 'AI ツール',
    shortcuts: [
      { keys: ['⌘', 'J'], label: 'OwnAI を開く' },
      { keys: ['⌘', '⇧', 'W'], label: '壁打ちを開く' },
      { keys: ['⌘', '⇧', 'E'], label: '文章増強' },
    ],
  },
  {
    title: '一般',
    shortcuts: [
      { keys: ['⌘', 'S'], label: '保存' },
      { keys: ['Esc'], label: 'モーダルを閉じる' },
    ],
  },
]

function ShortcutKey({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-medium rounded-md border bg-muted/60 text-muted-foreground border-border/60">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ⌘/ or Ctrl+/
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      {/* Help button trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-9 h-9 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-soft"
        aria-label="キーボードショートカット"
      >
        <Keyboard className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              キーボードショートカット
            </DialogTitle>
            <DialogDescription>
              よく使うショートカットキーの一覧です
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  {group.title}
                </h4>
                <div className="space-y-1">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.label}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground/80">
                        {shortcut.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <ShortcutKey key={`${shortcut.label}-${i}`}>
                            {key}
                          </ShortcutKey>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
