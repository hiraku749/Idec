'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'

interface DigestData {
  summary: string
  suggestions: string[]
}

export function DailyDigestBanner() {
  const [expanded, setExpanded] = useState(false)
  const [data, setData] = useState<DigestData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const today = new Date().toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  async function fetchDigest() {
    const cacheKey = `digest-${new Date().toISOString().slice(0, 10)}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      setData(JSON.parse(cached))
      return
    }

    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const result = await res.json()
        setData(result)
        sessionStorage.setItem(cacheKey, JSON.stringify(result))
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    if (next && !data && !loading) {
      void fetchDigest()
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 overflow-hidden">
      {/* ヘッダー（クリックで展開） */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-sm font-medium">デイリーダイアリー</span>
          <span className="text-xs text-muted-foreground">{today}</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* コンテンツ */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-amber-200/50 dark:border-amber-800/50">
          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              AIが今日のまとめを生成中...
            </div>
          )}
          {error && (
            <p className="text-sm text-muted-foreground py-3">
              生成に失敗しました。
              <button onClick={() => void fetchDigest()} className="underline ml-1 hover:text-foreground">
                再試行
              </button>
            </p>
          )}
          {!loading && !error && !data && (
            <div className="flex items-center justify-between py-3">
              <p className="text-sm text-muted-foreground">
                AIが今日のまとめを作成します
              </p>
              <button
                onClick={() => void fetchDigest()}
                className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                生成する
              </button>
            </div>
          )}
          {data && (
            <div className="space-y-3 pt-3">
              <p className="text-sm leading-relaxed">{data.summary}</p>
              {data.suggestions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">今日の提案</p>
                  <ul className="space-y-1.5">
                    {data.suggestions.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => void fetchDigest()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                更新
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
