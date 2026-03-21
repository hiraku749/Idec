'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'

interface DigestData {
  summary: string
  suggestions: string[]
}

export function DailyDigest() {
  const [data, setData] = useState<DigestData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function fetchDigest() {
    // セッションストレージからキャッシュを確認
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

  useEffect(() => {
    // キャッシュがあれば即座に表示
    const cacheKey = `digest-${new Date().toISOString().slice(0, 10)}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      setData(JSON.parse(cached))
    }
  }, [])

  if (error) return null

  return (
    <div className="border rounded-xl p-4 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          今日のダイジェスト
        </h2>
        <button
          onClick={fetchDigest}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {data ? '更新' : '生成'}
        </button>
      </div>

      {data ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">{data.summary}</p>
          {data.suggestions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">今日の提案</p>
              <ul className="space-y-1">
                {data.suggestions.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          「生成」をクリックしてAIに今日のまとめを作成してもらいましょう
        </p>
      )}
    </div>
  )
}
