'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { NoteEditor } from '@/components/notes/note-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Note, TiptapContent, NoteTag } from '@/types'

interface ProjectOption {
  id: string
  title: string
}

const TAGS: NoteTag[] = ['アイデア', '情報', 'ToDo']

export default function NoteDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [note, setNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<TiptapContent>({})
  const [tag, setTag] = useState<NoteTag | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/notes/${id}`)
      .then((r) => r.json())
      .then((data: Note) => {
        setNote(data)
        setTitle(data.title)
        setContent(data.content)
        setTag(data.tag)
        setProjectId(data.project_id ?? null)
        setLoading(false)
      })
      .catch(() => router.push('/notes'))
  }, [id, router])

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data.map((p: ProjectOption) => ({ id: p.id, title: p.title })))
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tag, project_id: projectId }),
    })
    setSaving(false)
  }

  async function handleTogglePin() {
    if (!note) return
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !note.is_pinned }),
    })
    const updated: Note = await res.json()
    setNote(updated)
  }

  async function handleDelete() {
    if (!confirm('ゴミ箱に移動しますか？')) return
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    router.push('/notes')
  }

  if (loading) {
    return <main className="p-6"><p className="text-muted-foreground text-sm">読み込み中...</p></main>
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push('/notes')} className="text-muted-foreground">
          ← ノート一覧
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTogglePin}>
            {note?.is_pinned ? '📌 ピン解除' : '📌 ピン留め'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
            削除
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* タイトル */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル"
        className="text-xl font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 mb-4"
      />

      {/* タグ選択 */}
      <div className="flex gap-2 mb-4">
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setTag(tag === t ? null : t)}
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

      {/* プロジェクト選択 */}
      <div className="mb-4">
        <select
          value={projectId ?? ''}
          onChange={(e) => setProjectId(e.target.value || null)}
          className="text-sm rounded-md border bg-background px-3 py-1.5 outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">プロジェクトなし</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* エディタ */}
      <div className="border rounded-lg p-4 min-h-[400px]">
        <NoteEditor content={content} onChange={setContent} />
      </div>
    </main>
  )
}
