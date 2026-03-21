'use client'

import { useState, useEffect } from 'react'

interface NoteItem {
  id: string
  title: string
  tag: string | null
  updated_at: string
}

type ContextGoal = 'prompt-engineering' | 'condense' | 'restructure'

const GOALS: { value: ContextGoal; label: string; description: string }[] = [
  {
    value: 'prompt-engineering',
    label: 'プロンプト生成',
    description: '選択したノートの内容をもとに、AIへの効果的なプロンプトを生成します',
  },
  {
    value: 'condense',
    label: '簡潔化',
    description: '複数のノートを重要ポイントを保ちながら、コンパクトにまとめます',
  },
  {
    value: 'restructure',
    label: '再構成',
    description: '情報を論理的な構造に整理し、見出し・箇条書きで読みやすくします',
  },
]

export default function ContextPage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [goal, setGoal] = useState<ContextGoal>('condense')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  function toggleNote(id: string) {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    )
  }

  async function handleRun() {
    if (selectedNoteIds.length === 0) return
    setRunning(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds: selectedNoteIds, goal }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = typeof data.error === 'string' ? data.error : '処理に失敗しました'
        setError(msg)
        return
      }

      setResult((data as { result: string }).result)
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setRunning(false)
    }
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold">コンテキストエンジニアリング</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ノートの内容をAIが整理・変換します。プロンプト生成・簡潔化・再構成から選択してください
        </p>
      </div>

      {/* ゴール選択 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">処理モードを選択</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {GOALS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoal(g.value)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                goal === g.value
                  ? 'border-primary bg-primary/10'
                  : 'hover:bg-accent'
              }`}
            >
              <div className="text-sm font-medium">{g.label}</div>
              <p className="text-xs text-muted-foreground mt-1">{g.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ノート選択（複数） */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">対象ノートを選択（複数可）</label>
          {selectedNoteIds.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedNoteIds.length}件選択中
            </span>
          )}
        </div>

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
            {notes.map((note) => {
              const isSelected = selectedNoteIds.includes(note.id)
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => toggleNote(note.id)}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors flex items-center gap-3 ${
                    isSelected
                      ? 'bg-primary/10 border-l-2 border-l-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  {/* チェックボックス風インジケーター */}
                  <div
                    className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
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
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 実行ボタン */}
      {selectedNoteIds.length > 0 && (
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={running}
          className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running
            ? '処理中...'
            : `${GOALS.find((g) => g.value === goal)?.label}を実行`}
        </button>
      )}

      {/* ローディング */}
      {running && (
        <div className="flex items-center gap-3 rounded-lg border p-4 animate-pulse">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">
            AIが処理しています...しばらくお待ちください
          </span>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">結果</h2>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="text-xs text-primary hover:underline"
            >
              {copied ? 'コピーしました！' : 'クリップボードにコピー'}
            </button>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans">
              {result}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
