'use client'

import { useState, useEffect } from 'react'
import { AiTypeSelector } from '@/components/ai/ai-type-selector'
import type { AiType, Project } from '@/types'

interface RoadmapResult {
  roadmapId: string
  structuredText: string
}

export default function RoadmapPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [aiType, setAiType] = useState<AiType>('balanced')
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
        body: JSON.stringify({ projectId: selectedProjectId, aiType }),
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ロードマップ</h1>
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
      {result && !loading && (
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">生成結果</h2>
            <span className="text-xs text-muted-foreground">ID: {result.roadmapId}</span>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/50 rounded-lg p-4 overflow-x-auto">
            {result.structuredText}
          </pre>
        </div>
      )}
    </div>
  )
}
