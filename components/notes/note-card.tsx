'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatRelative } from '@/lib/utils/format'
import { Pin, PinOff, Pencil, Trash2, MoreVertical } from 'lucide-react'
import type { Note } from '@/types'

interface NoteCardProps {
  note: Pick<Note, 'id' | 'title' | 'tag' | 'user_tags' | 'is_pinned' | 'updated_at'>
}

const TAG_COLORS: Record<string, string> = {
  アイデア: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  情報: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ToDo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export function NoteCard({ note }: NoteCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handlePin() {
    setMenuOpen(false)
    await fetch(`/api/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !note.is_pinned }),
    })
    router.refresh()
  }

  async function handleDelete() {
    setMenuOpen(false)
    if (!confirm('ゴミ箱に移動しますか？')) return
    await fetch(`/api/notes/${note.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="group relative border rounded-lg p-4 hover:border-foreground/30 hover:shadow-sm transition-all bg-card">
      {/* 操作メニューボタン */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setMenuOpen(!menuOpen)
        }}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
        title="操作メニュー"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* ドロップダウンメニュー */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-9 right-2 z-50 w-36 bg-card border rounded-lg shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-100">
            <button
              onClick={handlePin}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2"
            >
              {note.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              {note.is_pinned ? 'ピン解除' : 'ピン留め'}
            </button>
            <Link
              href={`/notes/${note.id}`}
              className="px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              <Pencil className="w-3.5 h-3.5" />
              編集
            </Link>
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors text-destructive flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              削除
            </button>
          </div>
        </>
      )}

      {/* カード本体（クリックで遷移） */}
      <Link href={`/notes/${note.id}`} className="block">
        {/* ピン留めバッジ */}
        {note.is_pinned && (
          <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Pin className="w-3 h-3" /> ピン留め
          </span>
        )}

        {/* タイトル */}
        <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-2 group-hover:text-foreground">
          {note.title || '無題のノート'}
        </h3>

        {/* タグ行 */}
        <div className="flex flex-wrap gap-1 mt-auto">
          {note.tag && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[note.tag] ?? ''}`}>
              {note.tag}
            </span>
          )}
          {note.user_tags.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {t}
            </span>
          ))}
        </div>

        {/* 更新日時 */}
        <p className="text-xs text-muted-foreground mt-2">{formatRelative(note.updated_at)}</p>
      </Link>
    </div>
  )
}
