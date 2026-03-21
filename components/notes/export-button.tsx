'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  noteId: string
}

const FORMATS = [
  { value: 'markdown', label: 'Markdown (.md)' },
  { value: 'text', label: 'テキスト (.txt)' },
  { value: 'html', label: 'HTML (.html)' },
] as const

export function ExportButton({ noteId }: ExportButtonProps) {
  const [open, setOpen] = useState(false)

  async function handleExport(format: string) {
    setOpen(false)

    const res = await fetch(`/api/export?noteId=${noteId}&format=${format}`)
    if (!res.ok) return

    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const filenameMatch = disposition.match(/filename="(.+)"/)
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : `export.${format === 'markdown' ? 'md' : format}`

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        エクスポート
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-background border rounded-md shadow-lg py-1 min-w-[160px]">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleExport(f.value)}
                className="w-full text-left text-sm px-3 py-1.5 hover:bg-accent transition-colors"
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
