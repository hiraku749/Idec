'use client'

import { useState, useMemo } from 'react'
import { History, ChevronDown } from 'lucide-react'
import { tiptapToText } from '@/lib/utils/tiptap'
import type { TiptapContent } from '@/types'

interface VersionDiffProps {
  currentContent: TiptapContent
  versionHistory: TiptapContent[]
}

/**
 * 簡易テキスト差分表示
 * diff-match-patch を動的インポートして使用
 */
export function VersionDiff({ currentContent, versionHistory }: VersionDiffProps) {
  const [open, setOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(0)
  const [diffHtml, setDiffHtml] = useState<string>('')
  const [computing, setComputing] = useState(false)

  const versions = useMemo(() => {
    return versionHistory.map((v, i) => ({
      index: i,
      label: `バージョン ${versionHistory.length - i}`,
      text: tiptapToText(v),
    }))
  }, [versionHistory])

  const currentText = useMemo(() => tiptapToText(currentContent), [currentContent])

  if (versionHistory.length === 0) return null

  async function computeDiff(versionIndex: number) {
    setComputing(true)
    setSelectedVersion(versionIndex)

    try {
      // diff-match-patch を動的インポート
      const DiffMatchPatch = (await import('diff-match-patch')).default
      const dmp = new DiffMatchPatch()

      const oldText = versions[versionIndex].text
      const diffs = dmp.diff_main(oldText, currentText)
      dmp.diff_cleanupSemantic(diffs)

      // HTML生成
      const html = diffs
        .map(([op, text]) => {
          const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')

          switch (op) {
            case 1: // 追加
              return `<ins class="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 no-underline">${escaped}</ins>`
            case -1: // 削除
              return `<del class="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200">${escaped}</del>`
            default: // 変更なし
              return `<span>${escaped}</span>`
          }
        })
        .join('')

      setDiffHtml(html)
    } finally {
      setComputing(false)
    }
  }

  return (
    <div className="mt-6 border-t pt-4">
      <button
        onClick={() => {
          setOpen(!open)
          if (!open && !diffHtml) {
            computeDiff(0)
          }
        }}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="w-3.5 h-3.5" />
        バージョン履歴（{versionHistory.length}件）
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3">
          {/* バージョン選択 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">比較対象:</span>
            <select
              value={selectedVersion}
              onChange={(e) => computeDiff(Number(e.target.value))}
              className="text-xs rounded-md border bg-background px-2 py-1 outline-none"
            >
              {versions.map((v) => (
                <option key={v.index} value={v.index}>
                  {v.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">→ 現在</span>
          </div>

          {/* 差分表示 */}
          {computing ? (
            <p className="text-sm text-muted-foreground">差分を計算中...</p>
          ) : (
            <div
              className="p-3 border rounded-md text-sm leading-relaxed font-mono overflow-x-auto max-h-[400px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: diffHtml }}
            />
          )}
        </div>
      )}
    </div>
  )
}
