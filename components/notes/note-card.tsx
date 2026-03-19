'use client'

import Link from 'next/link'
import { formatRelative } from '@/lib/utils/format'
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
  return (
    <Link href={`/notes/${note.id}`}>
      <div className="group border rounded-lg p-4 hover:border-foreground/30 hover:shadow-sm transition-all bg-card cursor-pointer">
        {/* ピン留めバッジ */}
        {note.is_pinned && (
          <span className="text-xs text-muted-foreground mb-1 block">📌 ピン留め</span>
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
      </div>
    </Link>
  )
}
