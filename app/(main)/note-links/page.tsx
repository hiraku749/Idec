'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Link2,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Search,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface NoteItem {
  id: string
  title: string
  tag: string | null
}

interface LinkItem {
  noteId: string
  title: string
}

type Feedback = { type: 'success' | 'error'; message: string } | null

export default function NoteLinksPage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null)
  const [forwardLinks, setForwardLinks] = useState<LinkItem[]>([])
  const [backLinks, setBackLinks] = useState<LinkItem[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)   // 追加中のnoteId
  const [removing, setRemoving] = useState<string | null>(null) // 削除中のnoteId
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [loadingNotes, setLoadingNotes] = useState(true)

  // フィードバック表示（3秒後に消える）
  const showFeedback = useCallback((fb: Feedback) => {
    setFeedback(fb)
    setTimeout(() => setFeedback(null), 3000)
  }, [])

  // ノート一覧取得（削除・アーカイブ済みを除く）
  useEffect(() => {
    setLoadingNotes(true)
    fetch('/api/notes')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotes(data)
      })
      .catch(() => showFeedback({ type: 'error', message: 'ノートの読み込みに失敗しました' }))
      .finally(() => setLoadingNotes(false))
  }, [showFeedback])

  // 選択ノートのリンク取得
  useEffect(() => {
    if (!selectedNote) return
    setLoadingLinks(true)
    setForwardLinks([])
    setBackLinks([])
    fetch(`/api/note-links?noteId=${selectedNote.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          showFeedback({ type: 'error', message: data.error })
          return
        }
        setForwardLinks(data.forwardLinks ?? [])
        setBackLinks(data.backLinks ?? [])
      })
      .catch(() => showFeedback({ type: 'error', message: 'リンクの読み込みに失敗しました' }))
      .finally(() => setLoadingLinks(false))
  }, [selectedNote, showFeedback])

  async function handleAddLink(targetNote: NoteItem) {
    if (!selectedNote || adding) return
    setAdding(targetNote.id)
    try {
      const res = await fetch('/api/note-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceNoteId: selectedNote.id, targetNoteId: targetNote.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        showFeedback({ type: 'error', message: typeof data.error === 'string' ? data.error : 'リンクの追加に失敗しました' })
        return
      }
      setForwardLinks((prev) => {
        if (prev.some((l) => l.noteId === targetNote.id)) return prev
        return [...prev, { noteId: targetNote.id, title: targetNote.title || '無題のノート' }]
      })
      showFeedback({ type: 'success', message: `「${targetNote.title || '無題'}」へのリンクを追加しました` })
      setAddSearch('')
    } finally {
      setAdding(null)
    }
  }

  async function handleRemoveLink(targetNoteId: string) {
    if (!selectedNote || removing) return
    setRemoving(targetNoteId)
    try {
      const res = await fetch(
        `/api/note-links?sourceNoteId=${selectedNote.id}&targetNoteId=${targetNoteId}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const data = await res.json()
        showFeedback({ type: 'error', message: typeof data.error === 'string' ? data.error : '削除に失敗しました' })
        return
      }
      setForwardLinks((prev) => prev.filter((l) => l.noteId !== targetNoteId))
      showFeedback({ type: 'success', message: 'リンクを削除しました' })
    } finally {
      setRemoving(null)
    }
  }

  // 左側フィルター
  const filteredNotes = notes.filter((n) =>
    (n.title || '無題のノート').toLowerCase().includes(search.toLowerCase()),
  )

  // リンク追加候補：選択ノート自身・既存リンク先を除く
  const addCandidates = notes.filter(
    (n) =>
      n.id !== selectedNote?.id &&
      !forwardLinks.some((l) => l.noteId === n.id) &&
      (addSearch === '' || (n.title || '無題のノート').toLowerCase().includes(addSearch.toLowerCase())),
  )

  const TAG_COLORS: Record<string, string> = {
    アイデア: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    情報: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    ToDo: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左カラム: ノート一覧 */}
      <div className="w-64 shrink-0 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-base font-bold flex items-center gap-1.5 mb-3">
            <Link2 className="w-4 h-4" />
            ノートリンク
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ノートを検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingNotes ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">
              {search ? '検索結果なし' : 'ノートがありません'}
            </p>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => {
                  setSelectedNote(note)
                  setAddSearch('')
                  setFeedback(null)
                }}
                className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                  selectedNote?.id === note.id
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-accent border-l-2 border-l-transparent'
                }`}
              >
                <p className="text-sm font-medium truncate">{note.title || '無題のノート'}</p>
                {note.tag && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${TAG_COLORS[note.tag] ?? ''}`}>
                    {note.tag}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t">
          <p className="text-[10px] text-muted-foreground text-center">
            {notes.length}件のノート
          </p>
        </div>
      </div>

      {/* 右エリア: リンク管理 */}
      <div className="flex-1 overflow-y-auto">
        {/* フィードバックトースト */}
        {feedback && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm animate-in fade-in-0 slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-destructive text-destructive-foreground'
          }`}>
            {feedback.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />
            }
            {feedback.message}
          </div>
        )}

        {!selectedNote ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Link2 className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">ノートを選択してください</p>
            <p className="text-xs mt-1">左のリストからノートを選ぶとリンクを管理できます</p>
          </div>
        ) : (
          <div className="p-6 max-w-2xl space-y-6">
            {/* 選択ノートヘッダー */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">選択中のノート</p>
                <h2 className="text-xl font-bold">{selectedNote.title || '無題のノート'}</h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>
                    出力リンク: <strong>{forwardLinks.length}</strong>
                  </span>
                  <span>
                    入力リンク: <strong>{backLinks.length}</strong>
                  </span>
                </div>
              </div>
              <Link
                href={`/notes/${selectedNote.id}`}
                className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                ノートを開く
              </Link>
            </div>

            {loadingLinks ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                リンクを読み込み中...
              </div>
            ) : (
              <>
                {/* 前方リンク（出力） */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <ArrowRight className="w-3.5 h-3.5" />
                    このノートからリンクしているノート
                    {forwardLinks.length > 0 && (
                      <span className="bg-muted rounded-full px-1.5">{forwardLinks.length}</span>
                    )}
                  </h3>
                  {forwardLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 pl-1">
                      まだリンクがありません。下から追加してください。
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {forwardLinks.map((link) => (
                        <div
                          key={link.noteId}
                          className="flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 bg-card hover:shadow-sm transition-shadow"
                        >
                          <Link
                            href={`/notes/${link.noteId}`}
                            className="text-sm text-primary hover:underline truncate flex items-center gap-1.5"
                          >
                            <ArrowRight className="w-3 h-3 shrink-0 opacity-50" />
                            {link.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleRemoveLink(link.noteId)}
                            disabled={removing === link.noteId}
                            className="text-muted-foreground hover:text-destructive shrink-0 transition-colors disabled:opacity-50"
                            title="リンクを削除"
                          >
                            {removing === link.noteId
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <X className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 後方リンク（入力） */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    このノートにリンクしているノート
                    {backLinks.length > 0 && (
                      <span className="bg-muted rounded-full px-1.5">{backLinks.length}</span>
                    )}
                  </h3>
                  {backLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 pl-1">
                      このノートを参照しているノートはありません
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {backLinks.map((link) => (
                        <Link
                          key={link.noteId}
                          href={`/notes/${link.noteId}`}
                          className="flex items-center gap-2 rounded-lg border px-4 py-2.5 bg-muted/40 text-sm text-primary hover:underline hover:shadow-sm transition-shadow"
                        >
                          <ArrowLeft className="w-3 h-3 shrink-0 opacity-50" />
                          {link.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                {/* リンク追加 */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Plus className="w-3.5 h-3.5" />
                    リンクを追加
                  </h3>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="リンク先のノートを絞り込み..."
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background"
                    />
                  </div>
                  <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    {addCandidates.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-4 text-center">
                        {addSearch ? '一致するノートがありません' : 'リンク可能なノートがありません'}
                      </p>
                    ) : (
                      addCandidates.map((note) => (
                        <button
                          key={note.id}
                          type="button"
                          onClick={() => void handleAddLink(note)}
                          disabled={adding === note.id}
                          className="w-full text-left px-4 py-2.5 border-b last:border-b-0 text-sm hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{note.title || '無題のノート'}</span>
                          {adding === note.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-right">
                    {addCandidates.length}件のノートをリンク可能
                  </p>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
