'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { ProjectStatus } from '@/types'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: '計画中' },
  { value: 'active', label: '進行中' },
  { value: 'completed', label: '完了' },
  { value: 'archived', label: 'アーカイブ' },
]

interface ProjectData {
  id: string
  title: string
  description: string
  goal: string
  deadline: string | null
  status: ProjectStatus
  progress_percent: number
}

export default function EditProjectPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    goal: '',
    deadline: '',
    status: 'planning' as ProjectStatus,
    progress_percent: 0,
  })

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data: ProjectData) => {
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          goal: data.goal ?? '',
          deadline: data.deadline ?? '',
          status: (data.status as ProjectStatus) ?? 'planning',
          progress_percent: data.progress_percent ?? 0,
        })
        setLoading(false)
      })
      .catch(() => router.push('/projects'))
  }, [id, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        goal: form.goal,
        deadline: form.deadline || null,
        status: form.status,
        progress_percent: form.progress_percent,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(typeof data.error === 'string' ? data.error : 'エラーが発生しました')
      setSaving(false)
      return
    }

    router.push(`/projects/${id}`)
  }

  if (loading) {
    return <div className="p-6"><p className="text-sm text-muted-foreground">読み込み中...</p></div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">プロジェクト編集</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            プロジェクト名 <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="goal" className="text-sm font-medium">目標</label>
          <input
            id="goal"
            type="text"
            maxLength={2000}
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">説明</label>
          <textarea
            id="description"
            rows={4}
            maxLength={2000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="status" className="text-sm font-medium">ステータス</label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="progress" className="text-sm font-medium">
              進捗 {form.progress_percent}%
            </label>
            <input
              id="progress"
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress_percent}
              onChange={(e) => setForm({ ...form, progress_percent: Number(e.target.value) })}
              className="w-full mt-2"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="deadline" className="text-sm font-medium">期限</label>
          <input
            id="deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-4 hover:bg-primary/80 transition-all disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-lg border text-sm font-medium h-9 px-4 hover:bg-accent transition-all"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}
