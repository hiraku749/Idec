'use client'

import { useEffect, useRef, useState } from 'react'

interface MermaidRendererProps {
  code: string
}

export function MermaidRenderer({ code }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !code.trim()) return

    setError(null)
    setRendered(false)

    // Mermaidをダイナミックインポート（SSRを避けるため）
    import('mermaid').then((m) => {
      const mermaid = m.default
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        securityLevel: 'loose',
      })

      const id = `mermaid-${Date.now()}`
      mermaid
        .render(id, code)
        .then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg
            setRendered(true)
          }
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : '図のレンダリングに失敗しました'
          setError(msg)
        })
    }).catch(() => {
      setError('Mermaidの読み込みに失敗しました')
    })
  }, [code])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive font-medium mb-1">図のレンダリングエラー</p>
        <p className="text-xs text-destructive/80">{error}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Mermaid構文が正しいか確認してください
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`flex justify-center p-4 rounded-lg border bg-card transition-opacity ${
        rendered ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
