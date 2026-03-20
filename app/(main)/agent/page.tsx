'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/components/ai/chat-message'
import { ChatInput } from '@/components/ai/chat-input'
import { AiTypeSelector } from '@/components/ai/ai-type-selector'
import type { AiType } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [aiType, setAiType] = useState<AiType>('balanced')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend(query: string) {
    const now = new Date().toISOString()
    const userMessage: Message = { role: 'user', content: query, timestamp: now }
    setMessages((prev) => [...prev, userMessage])
    setSending(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, aiType }),
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
        { role: 'assistant', content: data.answer, timestamp: new Date().toISOString() },
      ])
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
        <div>
          <h1 className="text-lg font-bold">OwnAI</h1>
          <p className="text-xs text-muted-foreground">ノートをナレッジとしてAIに質問</p>
        </div>
        <AiTypeSelector value={aiType} onChange={setAiType} />
      </div>

      {/* メッセージエリア */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-sm font-medium">OwnAIに質問してみましょう</p>
            <p className="text-xs mt-1">あなたのノートをナレッジとして回答します</p>
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
        placeholder="ノートに基づいた質問を入力..."
      />
    </div>
  )
}
