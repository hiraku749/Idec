'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ImportButton() {
  const [importing, setImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setImporting(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      const res = await fetch('/api/notes/import', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'インポートに失敗しました')
        return
      }

      const data: { imported: number; noteIds: string[] } = await res.json()
      toast.success(`${data.imported}件のノートをインポートしました`)
      router.refresh()
    } catch {
      toast.error('インポート中にエラーが発生しました')
    } finally {
      setImporting(false)
      // input をリセット（同じファイルを再選択可能にする）
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".md"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium h-8 px-3 hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
      >
        {importing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        インポート
      </button>
    </>
  )
}
