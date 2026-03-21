'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Combine, Loader2, Check } from 'lucide-react'

interface NoteOption {
  id: string
  title: string
  tag: string | null
}

export default function SynthesisPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<NoteOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ noteId: string; content: string } | null>(null)

  useEffect(() => {
    fetch('/api/notes')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotes(data)
      })
      .catch(() => {})
  }, [])

  function toggleNote(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  async function handleSynthesize() {
    if (selectedIds.length < 2) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds: selectedIds }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> 戻る
        </Button>
        <h1 className="text-lg font-medium flex items-center gap-2">
          <Combine className="w-5 h-5" />
          アイデア統合
        </h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        2〜5個のノートを選択すると、AIが共通テーマ・矛盾点・シナジーを分析し、統合レポートを生成します。
      </p>

      {/* ノート選択 */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">
          ノートを選択（{selectedIds.length}/5）
        </p>
        <div className="space-y-1 max-h-[300px] overflow-y-auto border rounded-lg p-2">
          {notes.map((note) => {
            const selected = selectedIds.includes(note.id)
            return (
              <button
                key={note.id}
                onClick={() => toggleNote(note.id)}
                className={`w-full text-left flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${
                  selected ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  selected ? 'bg-primary border-primary' : 'border-border'
                }`}>
                  {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="truncate">{note.title}</span>
                {note.tag && (
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">{note.tag}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <Button
        onClick={handleSynthesize}
        disabled={selectedIds.length < 2 || loading}
        className="w-full mb-6"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-1" /> 統合分析中...</>
        ) : (
          `${selectedIds.length}個のノートを統合する`
        )}
      </Button>

      {/* 結果 */}
      {result && (
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">統合レポート</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/notes/${result.noteId}`)}
            >
              ノートを開く
            </Button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {result.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold mt-4 mb-2">{line.slice(3)}</h2>
              if (line.startsWith('- ')) return <li key={i} className="text-sm ml-4">{line.slice(2)}</li>
              return line ? <p key={i} className="text-sm leading-relaxed">{line}</p> : <br key={i} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}
