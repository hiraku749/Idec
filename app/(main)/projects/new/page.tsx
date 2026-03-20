'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const body = {
      title: form.get('title') as string,
      description: form.get('description') as string,
      goal: form.get('goal') as string,
      deadline: (form.get('deadline') as string) || undefined,
    }

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(typeof data.error === 'string' ? data.error : 'エラーが発生しました')
      setSubmitting(false)
      return
    }

    const project = await res.json()
    router.push(`/projects/${project.id}`)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">新規プロジェクト</h1>

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
            name="title"
            type="text"
            required
            maxLength={200}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="例: Idec MVP開発"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="goal" className="text-sm font-medium">
            目標
          </label>
          <input
            id="goal"
            name="goal"
            type="text"
            maxLength={2000}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="例: 2026年4月末までにMVPリリース"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            説明
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="プロジェクトの概要を記載"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="deadline" className="text-sm font-medium">
            期限
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-4 hover:bg-primary/80 transition-all disabled:opacity-50"
          >
            {submitting ? '作成中...' : '作成する'}
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
