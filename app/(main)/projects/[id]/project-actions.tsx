'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ProjectActions({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/projects')
      router.refresh()
    } else {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-destructive border border-destructive rounded-md px-2 py-1 hover:bg-destructive/10 disabled:opacity-50"
        >
          {deleting ? '削除中...' : '本当に削除'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs border rounded-md px-2 py-1 hover:bg-accent"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-muted-foreground hover:text-destructive border rounded-md px-2 py-1 transition-colors"
    >
      削除
    </button>
  )
}
