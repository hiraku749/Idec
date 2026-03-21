'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { NoteEditor, type NoteOption } from '@/components/notes/note-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pin, PinOff, Trash2, Save, Loader2, ArrowLeft, Timer } from 'lucide-react'
import { ExportButton } from '@/components/notes/export-button'
import { Backlinks } from '@/components/notes/backlinks'
import { VersionDiff } from '@/components/notes/version-diff'
import { extractWikiLinkIds } from '@/lib/tiptap/wiki-link-extension'
import type { Note, TiptapContent, NoteTag } from '@/types'

interface ProjectOption {
  id: string
  title: string
}

const TAGS: NoteTag[] = ['アイデア', '情報', 'ToDo']

function extractDueDate(userTags: string[]): string {
  const due = userTags.find((t) => t.startsWith('due:'))
  return due ? due.slice(4) : ''
}

export default function NoteDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [note, setNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<TiptapContent>({})
  const [tag, setTag] = useState<NoteTag | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [noteOptions, setNoteOptions] = useState<NoteOption[]>([])
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [incubating, setIncubating] = useState(false)

  useEffect(() => {
    fetch(`/api/notes/${id}`)
      .then((r) => r.json())
      .then((data: Note) => {
        setNote(data)
        setTitle(data.title)
        setContent(data.content)
        setTag(data.tag)
        setProjectId(data.project_id ?? null)
        setDueDate(extractDueDate(data.user_tags ?? []))
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

  // ウィキリンクサジェスト用ノート一覧（自分自身を除く）
  useEffect(() => {
    fetch('/api/notes')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNoteOptions(
            data
              .filter((n: { id: string }) => n.id !== id)
              .map((n: { id: string; title: string; tag: string | null }) => ({
                id: n.id,
                label: n.title || '無題のノート',
                tag: n.tag,
              })),
          )
        }
      })
      .catch(() => {})
  }, [id])

  async function handleSave() {
    setSaving(true)

    // user_tags に期日を含める
    const existingTags = (note?.user_tags ?? []).filter((t) => !t.startsWith('due:'))
    const userTags = dueDate ? [...existingTags, `due:${dueDate}`] : existingTags

    await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tag, project_id: projectId, user_tags: userTags }),
    })

    // ウィキリンクを抽出して note_links を自動同期
    const wikiLinkIds = extractWikiLinkIds(content as Record<string, unknown>)
    await fetch('/api/note-links', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceNoteId: id, targetNoteIds: wikiLinkIds }),
    }).catch(() => {}) // リンク同期失敗は保存失敗にしない

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

  async function handleIncubate() {
    setIncubating(true)
    try {
      await fetch('/api/incubator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, days: 7 }),
      })
      alert('このアイデアを7日間インキュベーションに登録しました。')
    } finally {
      setIncubating(false)
    }
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
        <Button variant="ghost" onClick={() => router.push('/notes')} className="text-muted-foreground gap-1.5">
          <ArrowLeft className="w-4 h-4" /> ノート一覧
        </Button>
        <div className="flex gap-2">
          <ExportButton noteId={id} />
          <Button variant="outline" size="sm" onClick={handleIncubate} disabled={incubating} className="gap-1.5">
            <Timer className="w-3.5 h-3.5" /> {incubating ? '登録中...' : '寝かせる'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleTogglePin} className="gap-1.5">
            {note?.is_pinned ? <><PinOff className="w-3.5 h-3.5" /> ピン解除</> : <><Pin className="w-3.5 h-3.5" /> ピン留め</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> 削除
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 保存中...</> : <><Save className="w-3.5 h-3.5" /> 保存</>}
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
        <NoteEditor content={content} onChange={setContent} noteOptions={noteOptions} />
      </div>

      {/* バックリンク */}
      <Backlinks noteId={id} />

      {/* バージョン履歴差分 */}
      {note && (
        <VersionDiff
          currentContent={content}
          versionHistory={note.version_history ?? []}
        />
      )}
    </main>
  )
}
