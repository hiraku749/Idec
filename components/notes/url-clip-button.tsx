'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, X, Loader2, ExternalLink } from 'lucide-react'

export function UrlClipButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClip() {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json() as { title?: string; content?: unknown; sourceUrl?: string; error?: string }
      if (!res.ok) {
        setError((data.error as string) ?? 'エラーが発生しました')
        return
      }

      // 生成されたコンテンツでノートを作成
      const createRes = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title ?? 'Webクリップ',
          content: data.content,
          tag: '情報',
          user_tags: [`source:${data.sourceUrl ?? url}`],
        }),
      })
      const note = await createRes.json() as { id?: string }
      if (createRes.ok && note.id) {
        setOpen(false)
        setUrl('')
        router.push(`/notes/${note.id}`)
      } else {
        setError('ノートの保存に失敗しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleClip()
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setUrl(''); setError('') }}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors"
        title="WebページをURLからノートに取り込む"
      >
        <Link2 className="w-4 h-4" />
        URLクリップ
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg bg-background border rounded-xl shadow-2xl p-5 animate-fade-in-up">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="w-4 h-4 text-blue-500" />
                URLクリップ
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              WebページのURLを貼り付けると、AIがページ内容を要約してノートを自動生成します。
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <ExternalLink className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError('') }}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleClip()}
                disabled={!url.trim() || loading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 取り込み中...</> : '取り込む'}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-xs text-destructive">{error}</p>
            )}

            {loading && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ページを取得してAIが要約中...（10〜20秒かかります）
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
