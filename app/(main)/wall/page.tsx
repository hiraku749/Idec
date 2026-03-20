'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/components/ai/chat-message'
import { ChatInput } from '@/components/ai/chat-input'
import { AiTypeSelector } from '@/components/ai/ai-type-selector'
import type { AiType, WallMessage } from '@/types'

interface SessionInfo {
  id: string
  summary: string
  ai_type: string
  is_active: boolean
  updated_at: string
}

export default function WallPage() {
  const [messages, setMessages] = useState<WallMessage[]>([])
  const [aiType, setAiType] = useState<AiType>('balanced')
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [sending, setSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // セッション一覧取得
  useEffect(() => {
    fetch('/api/wall')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSessions(data)
      })
      .catch(() => {})
  }, [])

  // メッセージスクロール
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // セッション読み込み
  async function loadSession(id: string) {
    const res = await fetch(`/api/wall?sessionId=${id}`)
    if (!res.ok) return
    const data = await res.json()
    setSessionId(id)
    setMessages(data.messages ?? [])
    setAiType(data.ai_type ?? 'balanced')
    setShowSidebar(false)
  }

  // 新規セッション
  function newSession() {
    setSessionId(undefined)
    setMessages([])
    setShowSidebar(false)
  }

  async function handleSend(message: string) {
    const now = new Date().toISOString()
    setMessages((prev) => [...prev, { role: 'user', content: message, timestamp: now }])
    setSending(true)

    try {
      const res = await fetch('/api/wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, aiType }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorText = typeof data.error === 'string' ? data.error : 'エラーが発生しました'
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `エラー: ${errorText}`, timestamp: new Date().toISOString() },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, timestamp: new Date().toISOString() },
      ])

      // セッションID更新
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'ネットワークエラーが発生しました', timestamp: new Date().toISOString() },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      {/* セッションサイドバー（モバイル: トグル、デスクトップ: 常時表示） */}
      <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-56 shrink-0 border-r bg-card overflow-y-auto`}>
        <div className="p-3 border-b">
          <button
            onClick={newSession}
            className="w-full text-sm rounded-lg bg-primary text-primary-foreground font-medium h-8 hover:bg-primary/80 transition-all"
          >
            ＋ 新規セッション
          </button>
        </div>
        <div className="p-2 space-y-0.5">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`w-full text-left rounded-md px-3 py-2 text-xs transition-colors ${
                sessionId === s.id ? 'bg-accent font-medium' : 'hover:bg-accent/60'
              }`}
            >
              <p className="truncate">{s.summary || '新規セッション'}</p>
              <p className="text-muted-foreground mt-0.5">
                {s.is_active ? '🟢' : '⚪'} {s.ai_type}
              </p>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              セッションなし
            </p>
          )}
        </div>
      </div>

      {/* チャットエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden text-sm px-2 py-1 rounded border hover:bg-accent"
            >
              📋
            </button>
            <div>
              <h1 className="text-lg font-bold">壁打ち</h1>
              <p className="text-xs text-muted-foreground">
                {sessionId ? 'セッション進行中' : '新しいセッション'}
              </p>
            </div>
          </div>
          <AiTypeSelector value={aiType} onChange={setAiType} />
        </div>

        {/* メッセージエリア */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm font-medium">壁打ちを始めましょう</p>
              <p className="text-xs mt-1">アイデアを深掘りしたいテーマを入力してください</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-secondary">🤖</div>
              <div className="bg-card border rounded-lg px-4 py-2.5 text-sm text-muted-foreground animate-pulse">
                考え中...
              </div>
            </div>
          )}
        </div>

        {/* 入力エリア */}
        <ChatInput
          onSend={handleSend}
          disabled={sending}
          placeholder="アイデアや課題を入力..."
        />
      </div>
    </div>
  )
}
