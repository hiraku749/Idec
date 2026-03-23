'use client'

import { useState, useEffect } from 'react'
import { AiTypeSelector } from '@/components/ai/ai-type-selector'
import type { AiType } from '@/types'

interface NoteItem {
  id: string
  title: string
  tag: string | null
  updated_at: string
}

type EnhanceMode = 'replace' | 'new-note'

interface EnhanceResult {
  enhanced: string
  noteId: string
}

export default function EnhancePage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [aiType, setAiType] = useState<AiType>('balanced')
  const [mode, setMode] = useState<EnhanceMode>('new-note')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<EnhanceResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [customInstruction, setCustomInstruction] = useState('')

  // ノート一覧取得
  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch('/api/notes')
        if (!res.ok) throw new Error('ノート取得に失敗しました')
        const data: NoteItem[] = await res.json()
        setNotes(data)
      } catch {
        setError('ノート一覧の取得に失敗しました')
      } finally {
        setLoadingNotes(false)
      }
    }
    void fetchNotes()
  }, [])

  async function handleEnhance() {
    if (!selectedNoteId) return
    setRunning(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNoteId,
          aiType,
          mode,
          ...(customInstruction.trim() ? { customInstruction: customInstruction.trim() } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorText = typeof data.error === 'string' ? data.error : '増強処理に失敗しました'
        setError(errorText)
        return
      }

      setResult(data as EnhanceResult)
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setRunning(false)
    }
  }

  const selectedNote = notes.find((n) => n.id === selectedNoteId)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold">ブースト</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ノートの文章をAIがより明確で読みやすく改善します
        </p>
      </div>

      {/* ノート選択 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">対象ノートを選択</label>
        {loadingNotes ? (
          <div className="text-sm text-muted-foreground animate-pulse">
            ノートを読み込み中...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            ノートがありません。先にノートを作成してください。
          </div>
        ) : (
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                  selectedNoteId === note.id
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {note.title || '無題のノート'}
                  </span>
                  {note.tag && (
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      {note.tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  更新: {new Date(note.updated_at).toLocaleDateString('ja-JP')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 設定エリア */}
      {selectedNote && (
        <div className="space-y-4 border rounded-lg p-4">
          <div className="text-sm">
            選択中: <span className="font-medium">{selectedNote.title || '無題のノート'}</span>
          </div>

          {/* AI人格選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI人格</label>
            <AiTypeSelector value={aiType} onChange={setAiType} />
          </div>

          {/* モード選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">出力モード</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('new-note')}
                className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                  mode === 'new-note'
                    ? 'border-primary bg-primary/10'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="text-sm font-medium">新規ノートとして保存</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  元のノートはそのまま残ります
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMode('replace')}
                className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                  mode === 'replace'
                    ? 'border-primary bg-primary/10'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="text-sm font-medium">上書き</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  元のノートを増強版で置き換えます
                </p>
              </button>
            </div>
          </div>

          {/* 追加指示 */}
          <div>
            <label className="text-sm font-medium block mb-1.5">追加指示（任意）</label>
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="例: 箇条書きで / 英語で / 具体例を含めて"
              className="w-full text-sm rounded-lg border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* 実行ボタン */}
          <button
            type="button"
            onClick={() => void handleEnhance()}
            disabled={running}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? '増強中...' : '文章を増強する'}
          </button>
        </div>
      )}

      {/* ローディング */}
      {running && (
        <div className="flex items-center gap-3 rounded-lg border p-4 animate-pulse">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">
            AIが文章を増強しています...しばらくお待ちください
          </span>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">増強結果</h2>
            <a
              href={`/notes/${result.noteId}`}
              className="text-xs text-primary hover:underline"
            >
              ノートを開く
            </a>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <pre className="text-sm whitespace-pre-wrap leading-relaxed">
              {result.enhanced}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
