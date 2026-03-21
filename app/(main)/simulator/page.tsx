'use client'

import { useState, useRef, useEffect } from 'react'
import type { SimulatorMessage } from '@/lib/pipeline'

const PERSONA_TEMPLATES = [
  {
    label: '消費者（30代主婦）',
    value: '30代の主婦で、節約志向が強く、子育て中。新しいサービスには慎重で、口コミや実績を重視する。スマートフォンは使えるが、複雑な操作は苦手。',
  },
  {
    label: '提案者（スタートアップ創業者）',
    value: 'スタートアップの創業者。革新的なアイデアに情熱的で、リスクを恐れない。ビジネスモデルの改善提案や連携アイデアを積極的に出す傾向がある。',
  },
  {
    label: '競合他社担当者',
    value: '競合他社のプロダクトマネージャー。自社製品に誇りを持ち、他社の動向を常に分析している。競合優位性について詳しく、批判的な視点を持つ。',
  },
]

export default function SimulatorPage() {
  const [persona, setPersona] = useState('')
  const [history, setHistory] = useState<SimulatorMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  async function handleSend() {
    if (!input.trim() || !persona.trim() || sending) return
    setStarted(true)
    setSending(true)
    setError(null)

    const userMsg: SimulatorMessage = { role: 'user', content: input.trim() }
    const newHistory = [...history, userMsg]
    setHistory(newHistory)
    setInput('')

    try {
      const res = await fetch('/api/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          message: userMsg.content,
          history: history, // 送信前の履歴（今回のメッセージは含まない）
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : '処理に失敗しました')
        setHistory(history) // ロールバック
        return
      }
      const assistantMsg: SimulatorMessage = {
        role: 'assistant',
        content: (data as { reply: string }).reply,
      }
      setHistory([...newHistory, assistantMsg])
    } catch {
      setError('ネットワークエラーが発生しました')
      setHistory(history)
    } finally {
      setSending(false)
    }
  }

  function handleReset() {
    setHistory([])
    setStarted(false)
    setError(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AIシミュレーター</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ペルソナを設定してAIがなりきり対話します。ユーザーインタビューや提案練習に活用できます
        </p>
      </div>

      {/* ペルソナ設定（会話開始前のみ編集可能） */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">ペルソナ設定</label>
          {started && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              リセット
            </button>
          )}
        </div>

        {/* テンプレート */}
        {!started && (
          <div className="flex flex-wrap gap-2">
            {PERSONA_TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setPersona(t.value)}
                className="text-xs border rounded-full px-3 py-1 hover:bg-accent transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="例: 30代の会社員。テクノロジーに詳しく、新しいサービスを積極的に試す。コスパを重視する。"
          rows={3}
          disabled={started}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* 会話エリア */}
      {started && (
        <div className="border rounded-lg divide-y">
          <div className="p-3 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground">会話履歴</p>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-xs text-muted-foreground">
                  {msg.role === 'user' ? 'あなた' : 'AIペルソナ'}
                </span>
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs">返答中...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 入力エリア */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={persona.trim() ? 'メッセージを入力...' : 'まずペルソナを設定してください'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSend() }}
          disabled={!persona.trim() || sending}
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!input.trim() || !persona.trim() || sending}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          送信
        </button>
      </div>
    </div>
  )
}
