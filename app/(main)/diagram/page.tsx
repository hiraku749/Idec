'use client'

import { useState, useEffect } from 'react'
import { MermaidRenderer } from '@/components/diagram/mermaid-renderer'

interface NoteItem {
  id: string
  title: string
  tag: string | null
  updated_at: string
}

type DiagramFormat = 'mermaid' | 'markdown-outline' | 'structured-text'

const FORMATS: { value: DiagramFormat; label: string; description: string }[] = [
  {
    value: 'mermaid',
    label: 'Mermaid図',
    description: 'フローチャートやシーケンス図などを自動選択して生成',
  },
  {
    value: 'markdown-outline',
    label: 'Markdownアウトライン',
    description: '見出し・箇条書きによる階層構造に変換',
  },
  {
    value: 'structured-text',
    label: '構造化テキスト',
    description: 'セクション分けされた論理的な構造に整理',
  },
]

export default function DiagramPage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [format, setFormat] = useState<DiagramFormat>('mermaid')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ output: string; format: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [customInstruction, setCustomInstruction] = useState('')

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch('/api/notes')
        if (!res.ok) throw new Error()
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

  async function handleGenerate() {
    if (!selectedNoteId) return
    setRunning(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: selectedNoteId, format, ...(customInstruction.trim() ? { customInstruction: customInstruction.trim() } : {}) }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : '生成に失敗しました')
        return
      }

      setResult(data as { output: string; format: string })
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setRunning(false)
    }
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedNote = notes.find((n) => n.id === selectedNoteId)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold">図解</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ノートの内容をMermaid図・アウトライン・構造化テキストに変換します
        </p>
      </div>

      {/* フォーマット選択 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">出力形式を選択</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                format === f.value
                  ? 'border-primary bg-primary/10'
                  : 'hover:bg-accent'
              }`}
            >
              <div className="text-sm font-medium">{f.label}</div>
              <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ノート選択 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">対象ノートを選択</label>
        {loadingNotes ? (
          <div className="text-sm text-muted-foreground animate-pulse">読み込み中...</div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            ノートがありません。先にノートを作成してください。
          </div>
        ) : (
          <div className="border rounded-lg max-h-56 overflow-y-auto">
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

      {/* 実行ボタン */}
      {selectedNote && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            選択中: <span className="font-medium text-foreground">{selectedNote.title || '無題のノート'}</span>
          </div>
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
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={running}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? '生成中...' : `${FORMATS.find((f) => f.value === format)?.label}を生成`}
          </button>
        </div>
      )}

      {/* ローディング */}
      {running && (
        <div className="flex items-center gap-3 rounded-lg border p-4 animate-pulse">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">AIが生成しています...</span>
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 結果 */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">生成結果</h2>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="text-xs text-primary hover:underline"
            >
              {copied ? 'コピーしました！' : 'コードをコピー'}
            </button>
          </div>

          {/* Mermaid図のプレビュー */}
          {result.format === 'mermaid' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">プレビュー</p>
              <MermaidRenderer code={result.output} />
            </div>
          )}

          {/* コード表示 */}
          <div className="space-y-1">
            {result.format === 'mermaid' && (
              <p className="text-xs text-muted-foreground">Mermaidコード</p>
            )}
            <div className="rounded-lg border bg-muted p-4 overflow-x-auto">
              <pre className="text-sm leading-relaxed font-mono whitespace-pre-wrap">
                {result.output}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
