'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Copy, TrendingUp, Cpu, Briefcase, ShoppingCart, DollarSign } from 'lucide-react'
import type { OpponentRole } from '@/lib/pipeline'

interface NoteItem {
  id: string
  title: string
  tag: string | null
  updated_at: string
}

const ROLE_ICONS: Record<OpponentRole, React.ReactNode> = {
  marketer:  <TrendingUp className="w-4 h-4" />,
  engineer:  <Cpu className="w-4 h-4" />,
  executive: <Briefcase className="w-4 h-4" />,
  consumer:  <ShoppingCart className="w-4 h-4" />,
  investor:  <DollarSign className="w-4 h-4" />,
}

const ROLES: { value: OpponentRole; label: string; description: string }[] = [
  { value: 'marketer',  label: 'マーケター',  description: '市場性・顧客ニーズ・競合優位性の視点' },
  { value: 'engineer',  label: 'エンジニア',  description: '技術的実現性・スケーラビリティの視点' },
  { value: 'executive', label: '経営者',      description: 'ROI・リスク・戦略的整合性の視点' },
  { value: 'consumer',  label: '消費者',      description: '使いやすさ・価格・日常有用性の視点' },
  { value: 'investor',  label: '投資家',      description: '市場規模・収益性・Exit戦略の視点' },
]

export default function OpponentPage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [role, setRole] = useState<OpponentRole>('marketer')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ critique: string; role: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  async function handleRun() {
    if (!selectedNoteId) return
    setRunning(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/opponent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: selectedNoteId, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : '処理に失敗しました'); return }
      setResult(data as { critique: string; role: string })
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI反対者</h1>
        <p className="text-sm text-muted-foreground mt-1">
          指定した役職の視点でAIがノートの内容を批評します。弱点や改善点を発見しましょう
        </p>
      </div>

      {/* 役職選択 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">批評する役職を選択</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                role === r.value ? 'border-primary bg-primary/10' : 'hover:bg-accent'
              }`}
            >
              <div className="text-sm font-medium">{r.label}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
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
          <div className="text-sm text-muted-foreground">ノートがありません。先にノートを作成してください。</div>
        ) : (
          <div className="border rounded-lg max-h-56 overflow-y-auto">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                  selectedNoteId === note.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{note.title || '無題のノート'}</span>
                  {note.tag && <span className="text-xs text-muted-foreground ml-2 shrink-0">{note.tag}</span>}
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
      {selectedNoteId && (
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={running}
          className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? '批評中...' : `${ROLES.find((r) => r.value === role)?.label}として批評する`}
        </button>
      )}

      {running && (
        <div className="flex items-center gap-3 rounded-lg border p-4 animate-pulse">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">AIが批評しています...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {result && (() => {
        const matchedRole = ROLES.find((r) => r.label === result.role || r.value === result.role)
        const roleIcon = matchedRole ? ROLE_ICONS[matchedRole.value] : null
        const paragraphs = result.critique.split(/\n\n+/).filter((p) => p.trim())

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">批評結果</h2>
                <span className="inline-flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1 bg-primary/10 text-primary font-medium">
                  {roleIcon}
                  {matchedRole?.label ?? result.role}視点
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(result.critique)
                  toast.success('クリップボードにコピーしました')
                }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium hover:bg-accent transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                コピー
              </button>
            </div>
            <div className="rounded-lg border bg-card p-5 space-y-4">
              {paragraphs.map((para, idx) => {
                const trimmed = para.trim()
                // 見出し行を検出
                const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/)
                if (headingMatch) {
                  return (
                    <h3 key={idx} className="text-sm font-bold text-foreground pt-1">
                      {headingMatch[2]}
                    </h3>
                  )
                }
                // 箇条書き段落
                const lines = trimmed.split('\n')
                const isList = lines.every((l) => /^[-*]\s/.test(l.trim()) || !l.trim())
                if (isList) {
                  return (
                    <ul key={idx} className="space-y-1.5">
                      {lines.filter((l) => l.trim()).map((l, li) => (
                        <li key={li} className="text-sm leading-relaxed text-foreground/90 pl-3 border-l-2 border-muted">
                          {l.trim().replace(/^[-*]\s/, '')}
                        </li>
                      ))}
                    </ul>
                  )
                }
                // 通常段落
                return (
                  <p key={idx} className="text-sm leading-relaxed text-foreground/90">
                    {trimmed}
                  </p>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
