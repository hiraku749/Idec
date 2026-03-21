'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/components/ai/chat-message'
import { ChatInput } from '@/components/ai/chat-input'
import { AiTypeSelector } from '@/components/ai/ai-type-selector'
import { ReferencedNotes, type ReferencedNoteInfo } from '@/components/ai/referenced-notes'
import { Bot, Loader2, BookOpen } from 'lucide-react'
import type { AiType } from '@/types'
import { useActiveProject } from '@/lib/hooks/use-active-project'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  referencedNotes?: ReferencedNoteInfo[]
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [aiType, setAiType] = useState<AiType>('balanced')
  const [customInstruction, setCustomInstruction] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { activeProject } = useActiveProject()

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
        body: JSON.stringify({
          query,
          aiType,
          ...(customInstruction.trim() ? { customInstruction: customInstruction.trim() } : {}),
          ...(activeProject ? { projectId: activeProject.id } : {}),
        }),
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
        {
          role: 'assistant',
          content: data.answer,
          timestamp: new Date().toISOString(),
          referencedNotes: data.referencedNotes ?? [],
        },
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
      <div className="border-b shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-bold">OwnAI</h1>
            <p className="text-xs text-muted-foreground">
              {activeProject ? (
                <span className="flex items-center gap-1 text-primary">
                  <BookOpen className="w-3 h-3" />
                  {activeProject.title} のナレッジを使用中
                </span>
              ) : (
                'ノートをナレッジとしてAIに質問'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
              title="カスタム指示"
            >
              {showSettings ? '閉じる' : '設定'}
            </button>
            <AiTypeSelector value={aiType} onChange={setAiType} />
          </div>
        </div>
        {showSettings && (
          <div className="px-6 pb-3">
            <label className="text-xs text-muted-foreground block mb-1">
              カスタム指示（AIへの追加指示）
            </label>
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="例: 箇条書きで回答してください / 英語で回答してください"
              className="w-full text-sm rounded-lg border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={2}
              maxLength={1000}
            />
            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
              {customInstruction.length}/1000
            </p>
          </div>
        )}
      </div>

      {/* メッセージエリア */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">OwnAIに質問してみましょう</p>
            <p className="text-xs mt-1">あなたのノートをナレッジとして回答します</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <ChatMessage role={msg.role} content={msg.content} timestamp={msg.timestamp} />
            {msg.role === 'assistant' && msg.referencedNotes && msg.referencedNotes.length > 0 && (
              <div className="ml-11 mt-2">
                <ReferencedNotes notes={msg.referencedNotes} />
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex gap-3 animate-in fade-in-0 duration-200">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-card border rounded-lg px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
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
