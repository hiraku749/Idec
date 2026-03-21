'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface NoteOption {
  id: string
  title: string
  tag: string | null
  project_id: string | null
}

interface LinkNotesProps {
  projectId: string
}

export function LinkNotes({ projectId }: LinkNotesProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState<NoteOption[]>([])
  const [search, setSearch] = useState('')
  const [linking, setLinking] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    fetch('/api/notes')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // プロジェクトに未紐付けのノートのみ表示
          setNotes(data.filter((n: NoteOption) => n.project_id !== projectId))
        }
      })
      .catch(() => {})
  }, [open, projectId])

  async function handleLink(noteId: string) {
    setLinking(noteId)
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    })

    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      router.refresh()
    }
    setLinking(null)
  }

  const filtered = notes.filter((n) =>
    !search || (n.title || '無題').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors"
      >
        既存ノートを紐付け
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-card border rounded-lg shadow-lg z-50">
          <div className="p-2 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ノートを検索..."
              className="w-full text-sm rounded-md border bg-background px-3 py-1.5 outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {notes.length === 0 ? '紐付け可能なノートがありません' : '該当するノートがありません'}
              </p>
            )}
            {filtered.map((note) => (
              <button
                key={note.id}
                onClick={() => handleLink(note.id)}
                disabled={linking === note.id}
                className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-between"
              >
                <span className="truncate">
                  {note.tag && <span className="text-xs mr-1.5 px-1.5 py-0.5 rounded bg-muted">{note.tag}</span>}
                  {note.title || '無題のノート'}
                </span>
                {linking === note.id ? (
                  <span className="text-xs text-muted-foreground shrink-0">紐付け中...</span>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">+ 紐付け</span>
                )}
              </button>
            ))}
          </div>
          <div className="p-2 border-t">
            <button
              onClick={() => setOpen(false)}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
