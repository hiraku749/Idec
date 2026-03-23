'use client'

import { useEffect, useState } from 'react'
import { Mic, ExternalLink, Tag } from 'lucide-react'
import Link from 'next/link'
import type { NoteTag } from '@/types'

interface VoiceNote {
  id: string
  title: string
  tag: NoteTag | null
  user_tags: string[]
  created_at: string
  updated_at: string
}

const TAG_OPTIONS: NoteTag[] = ['アイデア', '情報', 'ToDo']

export default function VoiceBoxPage() {
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [savingTag, setSavingTag] = useState<string | null>(null)

  async function fetchNotes() {
    const res = await fetch('/api/notes?user_tag=voice')
    if (res.ok) {
      const data = await res.json() as VoiceNote[]
      setNotes(data)
    }
    setLoading(false)
  }

  useEffect(() => { void fetchNotes() }, [])

  async function updateTag(id: string, tag: NoteTag) {
    setSavingTag(id)
    await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    })
    setSavingTag(null)
    setEditingTag(null)
    void fetchNotes()
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('ja-JP', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Mic className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold">ボイスメモ</h1>
        <span className="text-sm text-muted-foreground">({notes.length}件)</span>
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      )}

      {!loading && notes.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Mic className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">音声メモがまだありません</p>
          <p className="text-xs mt-1">Fn キーを押して録音してください</p>
        </div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{note.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(note.created_at)}
                </p>
              </div>
              <Link
                href={`/notes/${note.id}`}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {editingTag === note.id ? (
                <div className="flex gap-1.5">
                  {TAG_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => void updateTag(note.id, t)}
                      disabled={savingTag === note.id}
                      className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                        note.tag === t
                          ? 'bg-foreground text-background border-foreground'
                          : 'text-muted-foreground border-border hover:border-foreground/50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <button
                    onClick={() => setEditingTag(null)}
                    className="text-xs px-2 py-0.5 text-muted-foreground hover:text-foreground"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingTag(note.id)}
                  className="text-xs px-2.5 py-0.5 rounded-full border border-border text-muted-foreground hover:border-foreground/50 transition-colors"
                >
                  {note.tag ?? 'タグなし'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
