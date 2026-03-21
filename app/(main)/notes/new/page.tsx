'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NoteEditor } from '@/components/notes/note-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { emptyTiptapContent, todoTiptapContent } from '@/lib/utils/tiptap'
import { TemplateSelector } from '@/components/notes/template-selector'
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
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  // エディタを再マウントするためのキー
  const [editorKey, setEditorKey] = useState(0)
  const prevTagRef = useRef<NoteTag | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data.map((p: ProjectOption) => ({ id: p.id, title: p.title })))
      })
      .catch(() => {})
  }, [])

  function handleTagChange(t: NoteTag) {
    const newTag = tag === t ? null : t
    setTag(newTag)

    // ToDo 選択時：エディタが空ならテンプレートを挿入
    if (newTag === 'ToDo' && prevTagRef.current !== 'ToDo') {
      const isContentEmpty =
        !content ||
        JSON.stringify(content) === JSON.stringify(emptyTiptapContent()) ||
        JSON.stringify(content) === JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })

      if (isContentEmpty) {
        setContent(todoTiptapContent())
        setEditorKey((k) => k + 1)
      }
    }

    prevTagRef.current = newTag
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        tag: tag ?? undefined,
        project_id: projectId || undefined,
        user_tags: dueDate ? [`due:${dueDate}`] : undefined,
      }),
    })

    if (!res.ok) {
      setError('保存に失敗しました')
      setSaving(false)
      return
    }

    router.push('/notes')
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground">
          ← 戻る
        </Button>
        <h1 className="text-lg font-medium">新規ノート</h1>
        <button
          onClick={() => setShowTemplates(true)}
          className="ml-auto text-xs px-3 py-1.5 rounded-md border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          テンプレートから作成
        </button>
      </div>

      {/* テンプレート選択モーダル */}
      <TemplateSelector
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={(templateContent, templateTitle) => {
          setContent(templateContent)
          if (templateTitle) setTitle(templateTitle)
          setEditorKey((k) => k + 1)
        }}
      />

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
            onClick={() => handleTagChange(t)}
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

      {/* ToDo の期日選択 */}
      {tag === 'ToDo' && (
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm text-muted-foreground">期日:</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-sm rounded-md border bg-background px-3 py-1.5 outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

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
      <div className="border rounded-lg min-h-[400px] overflow-hidden">
        <NoteEditor key={editorKey} content={content} onChange={setContent} />
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
