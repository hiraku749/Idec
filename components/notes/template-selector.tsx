'use client'

import { useState, useEffect } from 'react'
import { FileText, FolderOpen, X, Search } from 'lucide-react'
import { SYSTEM_TEMPLATES, type SystemTemplate } from '@/lib/templates/system-templates'
import type { TiptapContent, Template } from '@/types'

interface TemplateSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (content: TiptapContent, title?: string) => void
}

const CATEGORIES: Record<string, string> = {
  all: 'すべて',
  business: 'ビジネス',
  analysis: '分析',
  product: 'プロダクト',
  team: 'チーム',
  ideation: 'アイデア発想',
  personal: '個人',
  general: '一般',
}

export function TemplateSelector({ open, onClose, onSelect }: TemplateSelectorProps) {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [userTemplates, setUserTemplates] = useState<Template[]>([])

  useEffect(() => {
    if (open) {
      fetch('/api/templates')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUserTemplates(data.filter((t: Template) => !t.is_system))
          }
        })
        .catch(() => {})
    }
  }, [open])

  // モーダルを開くたびに検索をリセット
  useEffect(() => {
    if (open) setSearch('')
  }, [open])

  if (!open) return null

  const matchesSearch = (t: SystemTemplate | Template) => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  }

  const filteredSystem = SYSTEM_TEMPLATES
    .filter((t) => category === 'all' || t.category === category)
    .filter(matchesSearch)

  const filteredUser = userTemplates
    .filter((t) => category === 'all' || t.category === category)
    .filter(matchesSearch)

  function handleSelect(template: SystemTemplate | Template) {
    onSelect(template.content as TiptapContent, template.title)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[70vh] bg-background border rounded-xl shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            テンプレートを選択
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 検索 */}
        <div className="px-4 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="テンプレートを検索..."
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border bg-background outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* カテゴリフィルタ */}
        <div className="flex gap-1.5 p-3 border-b overflow-x-auto">
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors ${
                category === key
                  ? 'bg-foreground text-background border-foreground'
                  : 'text-muted-foreground border-border hover:border-foreground/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* テンプレートリスト */}
        <div className="overflow-y-auto max-h-[50vh] p-3">
          {/* システムテンプレート */}
          {filteredSystem.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 px-1">システムテンプレート</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredSystem.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="text-left p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{template.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ユーザーテンプレート */}
          {filteredUser.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 px-1">マイテンプレート</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredUser.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="text-left p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate">{template.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredSystem.length === 0 && filteredUser.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? `"${search}" に一致するテンプレートはありません` : 'このカテゴリにテンプレートはありません'}
            </p>
          )}
        </div>

        {/* フッター */}
        <div className="border-t p-3 text-xs text-muted-foreground text-center">
          白紙から始める場合は「×」で閉じてください
        </div>
      </div>
    </div>
  )
}
