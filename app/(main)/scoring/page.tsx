'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react'

interface NoteOption {
  id: string
  title: string
  tag: string | null
}

interface ScoreResult {
  feasibility: number
  impact: number
  effort: number
  originality: number
  comment: string
}

const AXES = [
  { key: 'feasibility', label: '実現可能性', color: '#3b82f6' },
  { key: 'impact', label: 'インパクト', color: '#f59e0b' },
  { key: 'effort', label: '低労力', color: '#10b981' },
  { key: 'originality', label: '独自性', color: '#8b5cf6' },
] as const

function RadarChart({ scores }: { scores: ScoreResult }) {
  const size = 200
  const center = size / 2
  const maxRadius = 80
  const levels = 5

  const axes = AXES.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
    const value = scores[axis.key as keyof ScoreResult] as number
    const radius = (value / levels) * maxRadius
    return {
      ...axis,
      angle,
      value,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      labelX: center + (maxRadius + 20) * Math.cos(angle),
      labelY: center + (maxRadius + 20) * Math.sin(angle),
    }
  })

  // ポリゴンの点
  const points = axes.map((a) => `${a.x},${a.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      {/* グリッド */}
      {Array.from({ length: levels }, (_, i) => {
        const r = ((i + 1) / levels) * maxRadius
        const gridPoints = AXES.map((_, j) => {
          const angle = (Math.PI * 2 * j) / AXES.length - Math.PI / 2
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
        }).join(' ')
        return (
          <polygon
            key={i}
            points={gridPoints}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={0.5}
          />
        )
      })}

      {/* 軸線 */}
      {axes.map((a, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={center + maxRadius * Math.cos(a.angle)}
          y2={center + maxRadius * Math.sin(a.angle)}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={0.5}
        />
      ))}

      {/* データポリゴン */}
      <polygon
        points={points}
        fill="hsl(var(--primary))"
        fillOpacity={0.2}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
      />

      {/* データ点 */}
      {axes.map((a, i) => (
        <circle key={i} cx={a.x} cy={a.y} r={3} fill={a.color} />
      ))}

      {/* ラベル */}
      {axes.map((a, i) => (
        <text
          key={i}
          x={a.labelX}
          y={a.labelY}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground text-[8px]"
        >
          {a.label}({a.value})
        </text>
      ))}
    </svg>
  )
}

export default function ScoringPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<NoteOption[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState<ScoreResult | null>(null)
  const [customInstruction, setCustomInstruction] = useState('')

  useEffect(() => {
    fetch('/api/notes?tag=アイデア')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotes(data)
      })
      .catch(() => {})
  }, [])

  async function handleScore() {
    if (!selectedNoteId) return
    setLoading(true)
    setScores(null)

    try {
      const res = await fetch('/api/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: selectedNoteId, ...(customInstruction.trim() ? { customInstruction: customInstruction.trim() } : {}) }),
      })
      if (res.ok) {
        const data = await res.json()
        setScores(data)
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
          <BarChart3 className="w-5 h-5" />
          アイデアスコアリング
        </h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        ノートをAIが4軸（実現可能性・インパクト・労力・独自性）で評価し、レーダーチャートで可視化します。
      </p>

      {/* ノート選択 */}
      <div className="flex gap-3 mb-4">
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
      </div>

      <div className="mb-4">
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

      <div className="mb-6">
        <Button onClick={handleScore} disabled={!selectedNoteId || loading} className="w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> 分析中...</> : 'スコアリング'}
        </Button>
      </div>

      {/* 結果表示 */}
      {scores && (
        <div className="border rounded-xl p-6 bg-card space-y-6">
          <RadarChart scores={scores} />

          {/* スコア詳細 */}
          <div className="grid grid-cols-2 gap-3">
            {AXES.map((axis) => (
              <div key={axis.key} className="flex items-center justify-between p-3 rounded-md border">
                <span className="text-sm">{axis.label}</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: i < (scores[axis.key as keyof ScoreResult] as number)
                            ? axis.color
                            : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold" style={{ color: axis.color }}>
                    {scores[axis.key as keyof ScoreResult]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* AIコメント */}
          {scores.comment && (
            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">AIの評価コメント</p>
              <p className="text-sm leading-relaxed">{scores.comment}</p>
            </div>
          )}

          {/* 総合スコア */}
          <div className="text-center border-t pt-4">
            <p className="text-xs text-muted-foreground mb-1">総合スコア</p>
            <p className="text-3xl font-bold">
              {((scores.feasibility + scores.impact + scores.effort + scores.originality) / 4).toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">/ 5.0</p>
          </div>
        </div>
      )}
    </div>
  )
}
