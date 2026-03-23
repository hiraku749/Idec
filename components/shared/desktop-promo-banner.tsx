'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Mic, Camera, Users, Zap } from 'lucide-react'

export function DesktopPromoBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Electron内では表示しない
    if (window.electronAPI) return
    const dismissed = localStorage.getItem('desktop-promo-dismissed')
    if (!dismissed) setShow(true)
  }, [])

  function dismiss() {
    localStorage.setItem('desktop-promo-dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="relative rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/8 to-transparent p-4 overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="閉じる"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-6">
        <div className="text-2xl shrink-0">⚡</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-0.5">デスクトップ版でもっと快適に</p>
          <p className="text-xs text-muted-foreground mb-3">
            Fnキー一発で音声入力・画面OCR・会議録音が使えます。どのアプリを使っていても瞬時にIdecへキャプチャ。
          </p>
          <div className="flex flex-wrap gap-3 mb-3">
            {[
              { icon: Mic, label: '音声入力 (Fn)' },
              { icon: Camera, label: '画面OCR (⌘⇧O)' },
              { icon: Users, label: '会議録音 (⌘⇧M)' },
              { icon: Zap, label: 'トレイ常駐' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="w-3 h-3 text-primary" />
                {label}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/download"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium h-7 px-3 hover:bg-primary/80 transition-all"
            >
              ダウンロード
            </Link>
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              今は表示しない
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
