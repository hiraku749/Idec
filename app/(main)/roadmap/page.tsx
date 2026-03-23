'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AiTypeSelector } from '@/components/ai/ai-type-selector'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import type { AiType, Project } from '@/types'

interface RoadmapResult {
  roadmapId: string
  structuredText: string
}

export default function RoadmapPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [aiType, setAiType] = useState<AiType>('balanced')
  const [customInstruction, setCustomInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [result, setResult] = useState<RoadmapResult | null>(null)
  const [error, setError] = useState('')

  // プロジェクト一覧を取得
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects')
        if (!res.ok) throw new Error('プロジェクトの取得に失敗しました')
        const data: Project[] = await res.json()
        setProjects(data)
        if (data.length > 0) {
          setSelectedProjectId(data[0].id)
        }
      } catch {
        setError('プロジェクトの取得に失敗しました')
      } finally {
        setLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [])

  async function handleGenerate() {
    if (!selectedProjectId) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          aiType,
          ...(customInstruction.trim() ? { customInstruction: customInstruction.trim() } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorText = typeof data.error === 'string' ? data.error : 'ロードマップの生成に失敗しました'
        setError(errorText)
        return
      }

      setResult(data as RoadmapResult)
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  /** ロードマップテキストをセクションに分割してパースする */
  const parseRoadmapSections = useCallback((text: string) => {
    // 空行で大きなセクションに分割し、番号付きヘッダーを検出
    const lines = text.split('\n')
    const sections: { title: string; body: string[] }[] = []
    let current: { title: string; body: string[] } | null = null

    for (const line of lines) {
      // フェーズ/ステップ見出し検出: "## ", "Phase ", "ステップ", 番号付き見出し
      const isHeading = /^(#{1,3}\s|Phase\s|フェーズ\s*\d|ステップ\s*\d|\d+[\.\)]\s)/.test(line.trim())
      if (isHeading && line.trim().length > 0) {
        if (current) sections.push(current)
        current = { title: line.trim().replace(/^#{1,3}\s*/, ''), body: [] }
      } else if (current) {
        current.body.push(line)
      } else {
        // 見出しの前のテキスト
        if (line.trim()) {
          if (!current) current = { title: '', body: [line] }
        }
      }
    }
    if (current) sections.push(current)
    return sections
  }, [])

  /** ノートとして保存 */
  async function handleSaveAsNote() {
    if (!result) return
    const title = `ロードマップ: ${selectedProject?.title ?? 'プロジェクト'}`
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: result.structuredText }],
        },
      ],
    }
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tag: 'Idea' }),
      })
      if (!res.ok) throw new Error()
      toast.success('ノートとして保存しました')
    } catch {
      toast.error('保存に失敗しました')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">戦略マップ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          プロジェクトからAIが実行ロードマップを自動生成します
        </p>
      </div>

      {/* 設定パネル */}
      <div className="rounded-lg border bg-card p-5 mb-6 space-y-4">
        {/* プロジェクト選択 */}
        <div>
          <label className="text-sm font-medium block mb-1.5">プロジェクト</label>
          {loadingProjects ? (
            <div className="text-sm text-muted-foreground animate-pulse">読み込み中...</div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              プロジェクトがありません。先にプロジェクトを作成してください。
            </p>
          ) : (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={loading}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
          {selectedProject && (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedProject.description || 'プロジェクトの説明なし'}
            </p>
          )}
        </div>

        {/* AI人格選択 */}
        <div>
          <label className="text-sm font-medium block mb-1.5">AI人格</label>
          <AiTypeSelector value={aiType} onChange={setAiType} />
        </div>

        {/* 追加指示 */}
        <div>
          <label className="text-sm font-medium block mb-1.5">追加指示（任意）</label>
          <textarea
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="例: 3ヶ月以内に完了できる計画で / エンジニア視点で詳細に"
            className="w-full text-sm rounded-lg border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            rows={2}
            maxLength={500}
          />
        </div>

        {/* 生成ボタン */}
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedProjectId || projects.length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-4 hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'ロードマップを生成中...' : 'ロードマップを生成'}
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="text-muted-foreground animate-pulse space-y-2">
            <p className="text-sm font-medium">AIがロードマップを生成しています...</p>
            <p className="text-xs">プロジェクトの内容を分析中です。少々お待ちください。</p>
          </div>
        </div>
      )}

      {/* 結果表示 */}
      {result && !loading && (() => {
        const sections = parseRoadmapSections(result.structuredText)
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">生成結果</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveAsNote()}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium hover:bg-accent transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  ノートとして保存
                </button>
                <Link
                  href={`/projects/${selectedProjectId}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 transition-all"
                >
                  プロジェクトで確認 →
                </Link>
              </div>
            </div>

            {sections.length > 1 ? (
              <div className="space-y-3">
                {sections.map((section, idx) => (
                  <div key={idx} className="rounded-lg border bg-card p-4">
                    {section.title && (
                      <div className="flex items-start gap-3 mb-2">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm font-bold pt-1">{section.title}</h3>
                      </div>
                    )}
                    <div className={section.title ? 'ml-10' : ''}>
                      {section.body.map((line, li) => {
                        const trimmed = line.trim()
                        if (!trimmed) return <div key={li} className="h-2" />
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                          return (
                            <p key={li} className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-muted py-0.5">
                              {trimmed.slice(2)}
                            </p>
                          )
                        }
                        return (
                          <p key={li} className="text-sm leading-relaxed text-foreground/90">
                            {trimmed}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-5">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {result.structuredText}
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
