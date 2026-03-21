'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bot } from 'lucide-react'
import type { Discussion, DiscussionMessage } from '@/types'

export default function DiscussionRoomPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [messages, setMessages] = useState<DiscussionMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('discussionName') ?? '名無し' : '名無し'
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [aiReplying, setAiReplying] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 初期データ取得
  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/discussions/${id}`)
        if (!res.ok) { router.push('/discussion'); return }
        const data = await res.json()
        setDiscussion((data as { discussion: Discussion }).discussion)
        setMessages((data as { messages: DiscussionMessage[] }).messages)
        if ((data as { discussion: Discussion }).discussion.history_summary) {
          setSummary((data as { discussion: Discussion }).discussion.history_summary)
        }
      } catch {
        setError('ルームの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    void fetchRoom()
  }, [id, router])

  // Supabase Realtimeでメッセージをリアルタイム受信
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`discussion-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_messages',
          filter: `discussion_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DiscussionMessage])
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [id])

  // 新メッセージで最下部にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return
    setSending(true)
    setError(null)

    try {
      const res = await fetch(`/api/discussions/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim(), displayName }),
      })
      if (!res.ok) { setError('メッセージの送信に失敗しました'); return }
      setInput('')
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setSending(false)
    }
  }, [id, input, displayName, sending])

  async function handleSummarize() {
    setSummarizing(true)
    setError(null)
    try {
      const res = await fetch(`/api/discussions/${id}/summarize`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : '要約に失敗しました'); return }
      setSummary((data as { summary: string }).summary)
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setSummarizing(false)
    }
  }

  async function handleAiReply() {
    setAiReplying(true)
    setError(null)
    try {
      const res = await fetch(`/api/discussions/${id}/ai-reply`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'AI返答に失敗しました'); return }
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setAiReplying(false)
    }
  }

  async function handleInvite() {
    try {
      const res = await fetch(`/api/discussions/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours: 24 }),
      })
      const data = await res.json()
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : '招待リンクの生成に失敗しました'); return }
      setInviteToken((data as { token: string }).token)
    } catch {
      setError('ネットワークエラーが発生しました')
    }
  }

  async function handleCopyToken() {
    if (!inviteToken) return
    await navigator.clipboard.writeText(inviteToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleNameChange(name: string) {
    setDisplayName(name)
    localStorage.setItem('discussionName', name)
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground animate-pulse">読み込み中...</div>
    )
  }

  if (!discussion) return null

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] max-h-screen">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
        <div>
          <button
            type="button"
            onClick={() => router.push('/discussion')}
            className="text-xs text-muted-foreground hover:text-foreground mb-1"
          >
            ← ルーム一覧
          </button>
          <h1 className="font-bold">{discussion.title}</h1>
          <p className="text-xs text-muted-foreground">{discussion.members.length}人参加中</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleAiReply()}
            disabled={aiReplying}
            className="text-xs rounded-lg border border-primary/30 bg-primary/5 text-primary px-3 py-1.5 hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Bot className="w-3.5 h-3.5" />
            {aiReplying ? 'AIが考え中...' : 'AIに参加してもらう'}
          </button>
          <button
            type="button"
            onClick={() => void handleSummarize()}
            disabled={summarizing}
            className="text-xs rounded-lg border px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-50"
          >
            {summarizing ? '要約中...' : 'AI要約'}
          </button>
          <button
            type="button"
            onClick={() => void handleInvite()}
            className="text-xs rounded-lg border px-3 py-1.5 hover:bg-accent transition-colors"
          >
            招待
          </button>
        </div>
      </div>

      {/* エラー */}
      {error && (
        <div className="mx-6 mt-2 rounded-lg border border-destructive/50 bg-destructive/10 p-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* 招待トークン表示 */}
      {inviteToken && (
        <div className="mx-6 mt-2 rounded-lg border bg-muted p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium">招待トークン（24時間有効）</p>
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{inviteToken}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyToken()}
            className="text-xs text-primary hover:underline shrink-0"
          >
            {copied ? 'コピー済み' : 'コピー'}
          </button>
        </div>
      )}

      {/* AI要約 */}
      {summary && (
        <div className="mx-6 mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary mb-1">AI要約</p>
          <pre className="text-xs text-foreground whitespace-pre-wrap font-sans">{summary}</pre>
        </div>
      )}

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            まだメッセージがありません。最初のメッセージを送ってみましょう。
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {msg.is_ai && <Bot className="w-3 h-3 text-primary" />}
                {msg.display_name} · {new Date(msg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className={`rounded-lg border px-3 py-2 text-sm max-w-[80%] ${
                msg.is_ai
                  ? 'bg-primary/5 border-primary/20 text-foreground'
                  : 'bg-card'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t px-6 py-3 space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">表示名:</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-xs border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring w-28"
            maxLength={50}
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="メッセージを入力..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !input.trim()}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  )
}
