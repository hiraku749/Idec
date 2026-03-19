'use client'

import { NoteCard } from './note-card'
import type { Note } from '@/types'

interface NoteListProps {
  notes: Pick<Note, 'id' | 'title' | 'tag' | 'user_tags' | 'is_pinned' | 'updated_at'>[]
}

export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-4xl mb-3">📝</p>
        <p className="text-sm">ノートがありません</p>
        <p className="text-xs mt-1">右上の「新規作成」から最初のノートを作りましょう</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  )
}
