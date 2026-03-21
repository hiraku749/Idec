'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Timer, Loader2, Sparkles } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

interface IncubationItem {
  id: string
  note_id: string
  start_date: string
  review_date: string
  status: string
  ai_review: Record<string, unknown> | null
  notes: { id: string; title: string }
}

interface ReviewResult {
  newPerspectives: string[]
  relatedIdeas: string[]
  developmentSuggestions: string[]
  summary: string
}

export default function IncubatorPage() {
  const router = useRouter()
  const [incubations, setIncubations] = useState<IncubationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)

  const load = () => {
    fetch('/api/incubator')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setIncubations(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleReview(incubationId: string) {
    setReviewing(incubationId)
    setReviewResult(null)

    try {
      const res = await fetch('/api/incubator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incubationId }),
      })
      if (res.ok) {
        const data = await res.json()
        setReviewResult(data)
        load() // リロード
      }
    } finally {
      setReviewing(null)
    }
  }

  const now = new Date()
  const ready = incubations.filter((i) => new Date(i.review_date) <= now)
  const waiting = incubations.filter((i) => new Date(i.review_date) > now)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> 戻る
        </Button>
        <h1 className="text-lg font-medium flex items-center gap-2">
          <Timer className="w-5 h-5" />
          アイデアインキュベーター
        </h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        アイデアを「寝かせて」おくと、指定期間後にAIが新しい視点でレビューします。
      </p>

      {loading && <p className="text-sm text-muted-foreground">読み込み中...</p>}

      {/* レビュー可能 */}
      {ready.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            レビュー可能（{ready.length}件）
          </h2>
          <div className="space-y-2">
            {ready.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                <div>
                  <p className="text-sm font-medium">{item.notes?.title ?? '無題'}</p>
                  <p className="text-xs text-muted-foreground">
                    開始: {formatDate(new Date(item.start_date))} → レビュー日: {formatDate(new Date(item.review_date))}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleReview(item.id)}
                  disabled={reviewing === item.id}
                >
                  {reviewing === item.id ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> レビュー中</>
                  ) : (
                    'AIレビュー実行'
                  )}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* インキュベーション中 */}
      {waiting.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            インキュベーション中（{waiting.length}件）
          </h2>
          <div className="space-y-2">
            {waiting.map((item) => {
              const daysLeft = Math.ceil((new Date(item.review_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{item.notes?.title ?? '無題'}</p>
                    <p className="text-xs text-muted-foreground">
                      あと{daysLeft}日（{formatDate(new Date(item.review_date))}にレビュー）
                    </p>
                  </div>
                  <Timer className="w-4 h-4 text-muted-foreground" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!loading && incubations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <Timer className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">インキュベーション中のアイデアはありません</p>
          <p className="text-xs mt-1">ノート詳細画面からアイデアをインキュベーションに追加できます</p>
        </div>
      )}

      {/* レビュー結果 */}
      {reviewResult && (
        <div className="border rounded-xl p-6 bg-card space-y-4 mt-6">
          <h2 className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AIレビュー結果
          </h2>

          {reviewResult.summary && (
            <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-md">{reviewResult.summary}</p>
          )}

          {reviewResult.newPerspectives.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1">新しい視点</h3>
              <ul className="space-y-1">
                {reviewResult.newPerspectives.map((p, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reviewResult.relatedIdeas.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1">関連するアイデア</h3>
              <ul className="space-y-1">
                {reviewResult.relatedIdeas.map((r, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reviewResult.developmentSuggestions.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1">発展提案</h3>
              <ul className="space-y-1">
                {reviewResult.developmentSuggestions.map((d, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
