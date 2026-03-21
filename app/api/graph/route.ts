import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/graph — ナレッジグラフ用のノード・エッジデータ
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  // ノートのメタデータ取得
  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, tag, user_tags, project_id, updated_at')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(100)

  // プロジェクト取得
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status')
    .eq('user_id', user.id)

  // ノートリンク取得
  const { data: links } = await supabase
    .from('note_links')
    .select('source_note_id, target_note_id')
    .eq('user_id', user.id)

  // ノードを構築
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

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // タグ→色のマッピング
  const tagColors: Record<string, string> = {
    'アイデア': '#f59e0b',
    '情報': '#3b82f6',
    'ToDo': '#10b981',
  }

  // ノートノード
  ;(notes ?? []).forEach((note) => {
    nodes.push({
      id: note.id,
      label: note.title || '無題',
      type: 'note',
      tag: note.tag,
      color: tagColors[note.tag ?? ''] ?? '#8b5cf6',
    })

    // プロジェクトエッジ
    if (note.project_id) {
      edges.push({
        source: note.id,
        target: note.project_id,
        type: 'project',
      })
    }
  })

  // プロジェクトノード
  ;(projects ?? []).forEach((project) => {
    nodes.push({
      id: project.id,
      label: project.title,
      type: 'project',
      color: '#ec4899',
    })
  })

  // ノートリンクエッジ
  ;(links ?? []).forEach((link) => {
    edges.push({
      source: link.source_note_id,
      target: link.target_note_id,
      type: 'link',
    })
  })

  // 同タグのノート間にエッジを追加（同タグ3件以上のノートがある場合のみ、代表ノードに接続）
  const tagGroups: Record<string, string[]> = {}
  ;(notes ?? []).forEach((note) => {
    if (note.tag) {
      if (!tagGroups[note.tag]) tagGroups[note.tag] = []
      tagGroups[note.tag].push(note.id)
    }
  })

  return NextResponse.json({ nodes, edges })
}
