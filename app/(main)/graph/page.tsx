'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Network } from 'lucide-react'

interface GraphNode {
  id: string
  label: string
  type: 'note' | 'project'
  tag?: string | null
  color: string
}

interface GraphEdge {
  source: string
  target: string
  type: 'link' | 'project' | 'tag'
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export default function GraphPage() {
  const router = useRouter()
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map())

  useEffect(() => {
    fetch('/api/graph')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // 簡易フォースレイアウト
  useEffect(() => {
    if (!data || data.nodes.length === 0) return

    const pos = new Map<string, { x: number; y: number; vx: number; vy: number }>()
    const width = 800
    const height = 600

    // 初期位置をランダムに設定
    data.nodes.forEach((node) => {
      pos.set(node.id, {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
      })
    })

    // シミュレーション
    for (let iter = 0; iter < 100; iter++) {
      // 反発力
      data.nodes.forEach((nodeA) => {
        data.nodes.forEach((nodeB) => {
          if (nodeA.id === nodeB.id) return
          const a = pos.get(nodeA.id)!
          const b = pos.get(nodeB.id)!
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
          const force = 5000 / (dist * dist)
          a.vx += (dx / dist) * force
          a.vy += (dy / dist) * force
        })
      })

      // 引力（エッジ）
      data.edges.forEach((edge) => {
        const a = pos.get(edge.source)
        const b = pos.get(edge.target)
        if (!a || !b) return
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const force = dist * 0.01
        a.vx += (dx / dist) * force
        a.vy += (dy / dist) * force
        b.vx -= (dx / dist) * force
        b.vy -= (dy / dist) * force
      })

      // 位置更新
      pos.forEach((p) => {
        p.x += p.vx * 0.1
        p.y += p.vy * 0.1
        p.vx *= 0.9
        p.vy *= 0.9
        // 境界
        p.x = Math.max(40, Math.min(width - 40, p.x))
        p.y = Math.max(40, Math.min(height - 40, p.y))
      })
    }

    const result = new Map<string, { x: number; y: number }>()
    pos.forEach((p, id) => result.set(id, { x: p.x, y: p.y }))
    setPositions(result)
  }, [data])

  // Canvas描画
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || positions.size === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = 800 * dpr
    canvas.height = 600 * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = '800px'
    canvas.style.height = '600px'

    // 背景
    ctx.clearRect(0, 0, 800, 600)

    // エッジ描画
    data.edges.forEach((edge) => {
      const a = positions.get(edge.source)
      const b = positions.get(edge.target)
      if (!a || !b) return

      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = edge.type === 'link' ? '#8b5cf6' : edge.type === 'project' ? '#ec4899' : '#d1d5db'
      ctx.lineWidth = edge.type === 'link' ? 1.5 : 0.8
      ctx.globalAlpha = 0.4
      ctx.stroke()
      ctx.globalAlpha = 1
    })

    // ノード描画
    data.nodes.forEach((node) => {
      const p = positions.get(node.id)
      if (!p) return

      const radius = node.type === 'project' ? 8 : 5

      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = node.color
      ctx.fill()

      // ラベル
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('color') || '#333'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      const label = node.label.length > 12 ? node.label.slice(0, 12) + '…' : node.label
      ctx.fillText(label, p.x, p.y + radius + 12)
    })
  }, [data, positions])

  useEffect(() => { draw() }, [draw])

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!data || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    for (const node of data.nodes) {
      const p = positions.get(node.id)
      if (!p) continue
      const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2)
      if (dist < 15) {
        if (node.type === 'note') router.push(`/notes/${node.id}`)
        else router.push(`/projects/${node.id}`)
        return
      }
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> 戻る
        </Button>
        <h1 className="text-lg font-medium flex items-center gap-2">
          <Network className="w-5 h-5" />
          ナレッジグラフ
        </h1>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        ノート・プロジェクトの関係をネットワークグラフで可視化します。ノードをクリックして遷移できます。
      </p>

      {/* 凡例 */}
      <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" />アイデア</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]" />情報</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]" />ToDo</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#ec4899]" />プロジェクト</span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : data && data.nodes.length > 0 ? (
        <div className="border rounded-lg overflow-hidden bg-card">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-pointer w-full max-w-[800px]"
            style={{ width: '100%', height: 'auto', aspectRatio: '4/3' }}
          />
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <Network className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">表示するデータがありません</p>
        </div>
      )}
    </div>
  )
}
