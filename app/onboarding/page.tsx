'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PROFESSION_PACKS } from '@/lib/profession-packs'
import { Loader2, ArrowRight } from 'lucide-react'

// 「その他」含む選択肢
const OPTIONS = [
  ...PROFESSION_PACKS.map((p) => ({ id: p.id, label: p.profession, icon: p.icon })),
  { id: 'other', label: 'その他', icon: '✨' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (!selected || submitting) return
    setSubmitting(true)
    setError(null)

    const option = OPTIONS.find((o) => o.id === selected)
    const packId = selected !== 'other' ? selected : undefined

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profession: option?.label ?? selected,
          packId,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'エラーが発生しました')
        return
      }

      router.replace('/dashboard')
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold mb-2">Idecへようこそ 👋</p>
          <p className="text-sm text-muted-foreground">
            あなたの職業に合ったナレッジテンプレートをセットアップします。
          </p>
        </div>

        {/* 職業選択 */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all active:scale-95 ${
                selected === opt.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:border-primary/40 hover:bg-accent/60'
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="text-xs font-medium leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>

        {selected && selected !== 'other' && (
          <p className="text-xs text-center text-muted-foreground mb-4">
            {PROFESSION_PACKS.find((p) => p.id === selected)?.notes.length ?? 0}件のテンプレートノートが追加されます
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive text-center mb-4">{error}</p>
        )}

        <button
          onClick={() => void handleStart()}
          disabled={!selected || submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              セットアップ中...
            </>
          ) : (
            <>
              はじめる
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          あとで「ナレッジパック」から変更できます
        </p>
      </div>
    </div>
  )
}
