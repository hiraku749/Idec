'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Grid2x2, Loader2 } from 'lucide-react'

interface NoteOption {
  id: string
  title: string
}

interface SwotResult {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

const QUADRANTS = [
  { key: 'strengths', label: 'Strengths', sublabel: '強み', color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
  { key: 'weaknesses', label: 'Weaknesses', sublabel: '弱み', color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' },
  { key: 'opportunities', label: 'Opportunities', sublabel: '機会', color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' },
  { key: 'threats', label: 'Threats', sublabel: '脅威', color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
] as const

export default function SwotPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [notes, setNotes] = useState<NoteOption[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState(searchParams.get('noteId') ?? '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SwotResult | null>(null)

  useEffect(() => {
    fetch('/api/notes')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotes(data)
      })
      .catch(() => {})
  }, [])

  async function handleAnalyze() {
    if (!selectedNoteId) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/swot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: selectedNoteId }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveAsNote() {
    if (!result) return
    const content = [
      '# SWOT分析',
      '',
      '## Strengths（強み）',
      ...result.strengths.map((s) => `- ${s}`),
      '',
      '## Weaknesses（弱み）',
      ...result.weaknesses.map((s) => `- ${s}`),
      '',
      '## Opportunities（機会）',
      ...result.opportunities.map((s) => `- ${s}`),
      '',
      '## Threats（脅威）',
      ...result.threats.map((s) => `- ${s}`),
    ].join('\n')

    const tiptapContent = {
      type: 'doc',
      content: content.split('\n').map((line) => ({
        type: 'paragraph',
        content: line ? [{ type: 'text', text: line }] : [],
      })),
    }

    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'SWOT分析', content: tiptapContent, tag: 'アイデア' }),
    })
    if (res.ok) {
      const note = await res.json()
      router.push(`/notes/${note.id}`)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> 戻る
        </Button>
        <h1 className="text-lg font-medium flex items-center gap-2">
          <Grid2x2 className="w-5 h-5" />
          SWOT分析
        </h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        ノートの内容を基にAIがSWOT分析を自動生成します。
      </p>

      <div className="flex gap-3 mb-6">
        <select
          value={selectedNoteId}
          onChange={(e) => setSelectedNoteId(e.target.value)}
          className="flex-1 text-sm rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">ノートを選択...</option>
          {notes.map((n) => (
            <option key={n.id} value={n.id}>{n.title}</option>
          ))}
        </select>
        <Button onClick={handleAnalyze} disabled={!selectedNoteId || loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> 分析中...</> : 'SWOT分析'}
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUADRANTS.map((q) => (
              <div key={q.key} className={`p-4 rounded-lg border ${q.color}`}>
                <h3 className="text-sm font-semibold mb-1">{q.label}</h3>
                <p className="text-xs text-muted-foreground mb-2">{q.sublabel}</p>
                <ul className="space-y-1.5">
                  {(result[q.key as keyof SwotResult] as string[]).map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-1.5">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleSaveAsNote}>
              ノートとして保存
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
