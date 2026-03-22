'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PROFESSION_PACKS, type ProfessionPack } from '@/lib/profession-packs'
import { CheckCircle2, Download, Loader2 } from 'lucide-react'

export default function PacksPage() {
  const router = useRouter()
  const [importing, setImporting] = useState<string | null>(null)
  const [imported, setImported] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  async function handleImport(pack: ProfessionPack) {
    if (importing) return
    setImporting(pack.id)
    setError(null)

    try {
      const res = await fetch(`/api/profession-packs/${pack.id}/import`, {
        method: 'POST',
      })
      const data = await res.json() as { imported?: number; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'インポートに失敗しました')
        return
      }

      setImported((prev) => new Set(Array.from(prev).concat(pack.id)))
      router.refresh()
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">ナレッジパック</h1>
        <p className="text-sm text-muted-foreground mt-1">
          職業に合わせたテンプレートノートをまとめてインポートできます。
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PROFESSION_PACKS.map((pack) => {
          const isDone = imported.has(pack.id)
          const isLoading = importing === pack.id

          return (
            <div
              key={pack.id}
              className={`relative rounded-xl border bg-gradient-to-br ${pack.color} p-5 flex flex-col gap-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{pack.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{pack.profession}</p>
                    <p className="text-[11px] text-muted-foreground">{pack.notes.length}件のテンプレート</p>
                  </div>
                </div>
                {isDone && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{pack.description}</p>

              <ul className="space-y-0.5">
                {pack.notes.map((note, i) => (
                  <li key={i} className="text-[11px] text-foreground/70 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-foreground/30 shrink-0" />
                    {note.title}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => void handleImport(pack)}
                disabled={isLoading || isDone}
                className="mt-auto flex items-center justify-center gap-1.5 w-full text-xs font-medium py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    インポート中...
                  </>
                ) : isDone ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    インポート済み
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    インポート
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
