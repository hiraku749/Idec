'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Discussion } from '@/types'

export default function DiscussionPage() {
  const router = useRouter()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [joinToken, setJoinToken] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchDiscussions()
  }, [])

  async function fetchDiscussions() {
    try {
      const res = await fetch('/api/discussions')
      if (!res.ok) throw new Error()
      const data: Discussion[] = await res.json()
      setDiscussions(data)
    } catch {
      setError('一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : '作成に失敗しました'); return }
      router.push(`/discussion/${(data as Discussion).id}`)
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin() {
    if (!joinToken.trim()) return
    setJoining(true)
    setError(null)
    try {
      const res = await fetch('/api/discussions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: joinToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : '参加に失敗しました'); return }
      router.push(`/discussion/${(data as { discussionId: string }).discussionId}`)
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ディスカッション</h1>
          <p className="text-sm text-muted-foreground mt-1">
            複数人でリアルタイムに議論し、AIが要点を要約します
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          新規作成
        </button>
      </div>

      {/* 新規作成フォーム */}
      {showCreate && (
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-medium">新しいルームを作成</h2>
          <input
            type="text"
            placeholder="ルームのタイトルを入力..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate() }}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating || !newTitle.trim()}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {creating ? '作成中...' : 'ルームを作成'}
          </button>
        </div>
      )}

      {/* 招待トークンで参加 */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-medium">招待リンクで参加</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="招待トークンを貼り付け..."
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => void handleJoin()}
            disabled={joining || !joinToken.trim()}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {joining ? '参加中...' : '参加'}
          </button>
        </div>
      </div>

      {/* エラー */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* ルーム一覧 */}
      {loading ? (
        <div className="text-sm text-muted-foreground animate-pulse">読み込み中...</div>
      ) : discussions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            参加中のディスカッションはありません
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            新規作成するか、招待リンクで参加してください
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">参加中のルーム</h2>
          {discussions.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => router.push(`/discussion/${d.id}`)}
              className="w-full text-left rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{d.title}</span>
                <span className="text-xs text-muted-foreground">
                  {d.members.length}人参加中
                </span>
              </div>
              {d.history_summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {d.history_summary}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(d.created_at).toLocaleDateString('ja-JP')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
