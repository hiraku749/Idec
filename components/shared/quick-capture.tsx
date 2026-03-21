'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, X } from 'lucide-react'
import type { NoteTag } from '@/types'

const TAGS: NoteTag[] = ['アイデア', '情報', 'ToDo']

export function QuickCapture() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [tag, setTag] = useState<NoteTag>('アイデア')
  const [saving, setSaving] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleOpen = useCallback(() => {
    setOpen(true)
    setTitle('')
    setMemo('')
    setTag('アイデア')
  }, [])

  const handleClose = useCallback(() => {
    if (!saving) setOpen(false)
  }, [saving])

  // グローバルキーボードショートカット: Cmd+Shift+N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'n') {
        e.preventDefault()
        handleOpen()
      }
      if (e.key === 'Escape' && open) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleOpen, handleClose, open])

  // モーダルが開いたらタイトルにフォーカス
  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 100)
    }
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
        body: JSON.stringify({ title: title.trim(), content, tag }),
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
      handleSave()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* モーダル */}
      <div
        className="relative w-full max-w-lg bg-background border rounded-xl shadow-2xl p-5 animate-fade-in-up"
        onKeyDown={handleKeyDown}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Zap className="w-4 h-4 text-amber-500" />
            クイックキャプチャ
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* タイトル */}
        <input
          ref={titleRef}
          type="text"
          placeholder="アイデアのタイトル..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-medium bg-transparent border-0 border-b border-border pb-2 mb-3 outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
        />

        {/* メモ */}
        <textarea
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          className="w-full text-sm bg-transparent border rounded-md p-2 mb-3 outline-none resize-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
        />

        {/* タグ選択 */}
        <div className="flex items-center gap-2 mb-4">
          {TAGS.map((t) => (
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

        {/* フッター */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            ⌘+Enter で保存 / Esc で閉じる
          </span>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
