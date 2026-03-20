'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface ReferencedNoteInfo {
  noteId: string
  title: string
  summary: string
  similarity: number
}

interface ReferencedNotesProps {
  notes: ReferencedNoteInfo[]
}

export function ReferencedNotes({ notes }: ReferencedNotesProps) {
  const [expanded, setExpanded] = useState(false)

  if (notes.length === 0) return null

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <span>📚</span>
          参照ノート ({notes.length}件)
        </span>
        <span className={cn('transition-transform', expanded && 'rotate-180')}>▼</span>
      </button>
      {expanded && (
        <div className="border-t divide-y">
          {notes.map((note) => (
            <div key={note.noteId} className="px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <Link
                  href={`/notes/${note.noteId}`}
                  className="text-xs font-medium hover:underline truncate max-w-[70%]"
                >
                  {note.title || '無題のノート'}
                </Link>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  類似度 {(note.similarity * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                {note.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
