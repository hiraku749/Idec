import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/pgvector/embed'

// --- Markdown → Tiptap JSON 変換 ---

interface TiptapMark {
  type: string
}

interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
}

/** インラインマーク（bold, italic）を解析してテキストノード配列を返す */
function parseInlineMarks(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = []
  // **bold** と *italic* をパース（ネストは非対応、シンプルに順次処理）
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // マッチ前のプレーンテキスト
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index)
      if (plain) nodes.push({ type: 'text', text: plain })
    }

    if (match[2]) {
      // **bold**
      nodes.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] })
    } else if (match[3]) {
      // *italic*
      nodes.push({ type: 'text', text: match[3], marks: [{ type: 'italic' }] })
    }

    lastIndex = match.index + match[0].length
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex)
    if (remaining) nodes.push({ type: 'text', text: remaining })
  }

  // テキストが空の場合
  if (nodes.length === 0 && text) {
    nodes.push({ type: 'text', text })
  }

  return nodes
}

/** Markdown テキストを Tiptap JSON に変換 */
function markdownToTiptap(markdown: string): TiptapNode {
  const lines = markdown.split('\n')
  const content: TiptapNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 空行 → 空パラグラフ
    if (line.trim() === '') {
      // 連続空行はスキップ（前がすでに空パラグラフなら追加しない）
      i++
      continue
    }

    // 見出し: # ## ###
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      content.push({
        type: 'heading',
        attrs: { level },
        content: parseInlineMarks(text),
      })
      i++
      continue
    }

    // タスクリスト: - [ ] / - [x]
    const taskItems: TiptapNode[] = []
    while (i < lines.length) {
      const taskMatch = lines[i].match(/^[-*]\s+\[([ xX])\]\s+(.+)$/)
      if (!taskMatch) break
      const checked = taskMatch[1].toLowerCase() === 'x'
      const text = taskMatch[2]
      taskItems.push({
        type: 'taskItem',
        attrs: { checked },
        content: [
          {
            type: 'paragraph',
            content: parseInlineMarks(text),
          },
        ],
      })
      i++
    }
    if (taskItems.length > 0) {
      content.push({
        type: 'taskList',
        content: taskItems,
      })
      continue
    }

    // 箇条書き: - item / * item
    const bulletItems: TiptapNode[] = []
    while (i < lines.length) {
      const bulletMatch = lines[i].match(/^[-*]\s+(.+)$/)
      if (!bulletMatch) break
      // タスクリストでないことを確認
      if (lines[i].match(/^[-*]\s+\[[ xX]\]/)) break
      const text = bulletMatch[1]
      bulletItems.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: parseInlineMarks(text),
          },
        ],
      })
      i++
    }
    if (bulletItems.length > 0) {
      content.push({
        type: 'bulletList',
        content: bulletItems,
      })
      continue
    }

    // 通常のパラグラフ
    content.push({
      type: 'paragraph',
      content: parseInlineMarks(line),
    })
    i++
  }

  // コンテンツが空の場合、空パラグラフを入れる
  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [] })
  }

  return {
    type: 'doc',
    content,
  }
}

// --- API ハンドラ ---

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const formData = await request.formData()
  const files = formData.getAll('files')

  if (files.length === 0) {
    return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
  }

  const noteIds: string[] = []

  for (const file of files) {
    if (!(file instanceof File)) continue
    if (!file.name.endsWith('.md')) continue

    // ファイル名から拡張子を除いてタイトルに
    const title = file.name.replace(/\.md$/, '')
    const markdownText = await file.text()

    // Markdown → Tiptap JSON
    const content = markdownToTiptap(markdownText)

    // ベクトル埋め込み生成
    const plainText = `${title}\n${markdownText}`
    const vector = await embedText(plainText)

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title,
        content,
        vector_embedding: JSON.stringify(vector),
      })
      .select('id')
      .single()

    if (error) {
      console.error('ノートインポートエラー:', error.message)
      continue
    }

    if (data) {
      noteIds.push(data.id as string)
    }
  }

  return NextResponse.json({ imported: noteIds.length, noteIds })
}
