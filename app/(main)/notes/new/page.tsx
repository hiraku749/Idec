'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NoteEditor } from '@/components/notes/note-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { emptyTiptapContent } from '@/lib/utils/tiptap'
import type { TiptapContent, NoteTag } from '@/types'

interface ProjectOption {
  id: string
  title: string
}

const TAGS: NoteTag[] = ['アイデア', '情報', 'ToDo']

export default function NewNotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<TiptapContent>(emptyTiptapContent())
  const [tag, setTag] = useState<NoteTag | null>(null)
  const [projectId, setProjectId] = useState<string | null>(searchParams.get('projectId'))
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setError(null)

    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tag, project_id: projectId || undefined }),
    })

    if (!res.ok) {
      setError('保存に失敗しました')
      setSaving(false)
      return
    }

    const note = await res.json()
    router.push(`/notes/${note.id}`)
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground">
          ← 戻る
        </Button>
        <h1 className="text-lg font-medium">新規ノート</h1>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{error}</p>
      )}

      {/* タイトル */}
      <Input
        placeholder="タイトル（任意）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
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

      {/* 保存ボタン */}
      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </main>
  )
}
