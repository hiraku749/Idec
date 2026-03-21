'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Link2, ArrowRight, ArrowLeft, Plus, X, Search } from 'lucide-react'

interface NoteItem {
  id: string
  title: string
  tag: string | null
}

interface LinkItem {
  noteId: string
  title: string
}

export default function NoteLinksPage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [filteredNotes, setFilteredNotes] = useState<NoteItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null)
  const [forwardLinks, setForwardLinks] = useState<LinkItem[]>([])
  const [backLinks, setBackLinks] = useState<LinkItem[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/notes')
      .then((r) => r.json())
      .then((data: NoteItem[]) => {
        if (Array.isArray(data)) {
          setNotes(data)
          setFilteredNotes(data)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredNotes(
      notes.filter((n) => (n.title || '無題のノート').toLowerCase().includes(q)),
    )
  }, [search, notes])

  useEffect(() => {
    if (!selectedNote) return
    setLoadingLinks(true)
    fetch(`/api/note-links?noteId=${selectedNote.id}`)
      .then((r) => r.json())
      .then((data) => {
        setForwardLinks(data.forwardLinks ?? [])
        setBackLinks(data.backLinks ?? [])
      })
      .catch(() => {})
      .finally(() => setLoadingLinks(false))
  }, [selectedNote])

  async function handleAddLink(targetNote: NoteItem) {
    if (!selectedNote) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch('/api/note-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceNoteId: selectedNote.id, targetNoteId: targetNote.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(typeof data.error === 'string' ? data.error : 'リンクの追加に失敗しました')
        return
      }
      setForwardLinks((prev) => {
        if (prev.some((l) => l.noteId === targetNote.id)) return prev
        return [...prev, { noteId: targetNote.id, title: targetNote.title || '無題のノート' }]
      })
      setAddSearch('')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveLink(targetNoteId: string) {
    if (!selectedNote) return
    const newTargetIds = forwardLinks
      .filter((l) => l.noteId !== targetNoteId)
      .map((l) => l.noteId)

    const res = await fetch('/api/note-links', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceNoteId: selectedNote.id, targetNoteIds: newTargetIds }),
    })
    if (res.ok) {
      setForwardLinks((prev) => prev.filter((l) => l.noteId !== targetNoteId))
    }
  }

  const addCandidates = notes.filter(
    (n) =>
      n.id !== selectedNote?.id &&
      !forwardLinks.some((l) => l.noteId === n.id) &&
      (n.title || '無題のノート').toLowerCase().includes(addSearch.toLowerCase()),
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Link2 className="w-6 h-6" />
          ノートリンク
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ノート同士を手動でリンクして関係を可視化しましょう
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ノート選択 */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ノートを検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>

          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                ノートがありません
              </p>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => {
                    setSelectedNote(note)
                    setAddSearch('')
                    setError(null)
                  }}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors text-sm ${
                    selectedNote?.id === note.id
                      ? 'bg-primary/10 border-l-2 border-l-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  <p className="font-medium truncate">{note.title || '無題のノート'}</p>
                  {note.tag && (
                    <span className="text-xs text-muted-foreground">{note.tag}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* リンク管理 */}
        <div className="space-y-4">
          {!selectedNote ? (
            <div className="flex items-center justify-center h-48 border rounded-lg border-dashed text-muted-foreground">
              <p className="text-sm">左のリストからノートを選択してください</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-0.5">選択中のノート</p>
                <Link
                  href={`/notes/${selectedNote.id}`}
                  className="font-medium text-sm hover:underline text-primary"
                >
                  {selectedNote.title || '無題のノート'}
                </Link>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              {loadingLinks ? (
                <p className="text-sm text-muted-foreground animate-pulse">読み込み中...</p>
              ) : (
                <>
                  {/* 前方リンク */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                      このノートがリンクしているノート
                    </h3>
                    {forwardLinks.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-5">まだリンクがありません</p>
                    ) : (
                      <div className="space-y-1">
                        {forwardLinks.map((link) => (
                          <div
                            key={link.noteId}
                            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 bg-card"
                          >
                            <Link
                              href={`/notes/${link.noteId}`}
                              className="text-sm text-primary hover:underline truncate"
                            >
                              {link.title}
                            </Link>
                            <button
                              type="button"
                              onClick={() => void handleRemoveLink(link.noteId)}
                              className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* バックリンク */}
                  {backLinks.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        このノートにリンクしているノート
                      </h3>
                      <div className="space-y-1">
                        {backLinks.map((link) => (
                          <Link
                            key={link.noteId}
                            href={`/notes/${link.noteId}`}
                            className="flex items-center gap-2 rounded-md border px-3 py-2 bg-card text-sm text-primary hover:underline"
                          >
                            {link.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* リンク追加 */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      リンクを追加
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="リンク先のノートを検索..."
                        value={addSearch}
                        onChange={(e) => setAddSearch(e.target.value)}
                        className="w-full rounded-lg border pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background"
                      />
                    </div>
                    {addSearch && (
                      <div className="border rounded-lg max-h-40 overflow-y-auto">
                        {addCandidates.length === 0 ? (
                          <p className="text-xs text-muted-foreground p-3 text-center">
                            候補がありません
                          </p>
                        ) : (
                          addCandidates.slice(0, 8).map((note) => (
                            <button
                              key={note.id}
                              type="button"
                              onClick={() => void handleAddLink(note)}
                              disabled={adding}
                              className="w-full text-left px-3 py-2.5 border-b last:border-b-0 text-sm hover:bg-accent transition-colors disabled:opacity-50"
                            >
                              {note.title || '無題のノート'}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
