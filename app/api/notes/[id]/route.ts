import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateNoteSchema } from '@/lib/validations/schemas'
import { embedText } from '@/lib/pgvector/embed'
import { tiptapToText } from '@/lib/utils/tiptap'
import { extractTodosFromContent } from '@/lib/utils/todo-sync'

type Params = { params: { id: string } }

// GET /api/notes/[id] — ノート詳細取得
export async function GET(_request: Request, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'ノートが見つかりません' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// PATCH /api/notes/[id] — ノート更新
export async function PATCH(request: Request, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = updateNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updates = parsed.data

  // コンテンツが変わるときは旧バージョンを version_history に保存してベクトル再生成
  if (updates.content !== undefined) {
    const { data: current } = await supabase
      .from('notes')
      .select('content, version_history, title')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (current) {
      const history = Array.isArray(current.version_history)
        ? current.version_history
        : []
      ;(updates as Record<string, unknown>).version_history = [
        current.content,
        ...history,
      ].slice(0, 20) // 最大20世代保持

      const titleForEmbed = (updates.title as string | undefined) ?? (current.title as string)
      const plainText = `${titleForEmbed}\n${tiptapToText(updates.content)}`
      const vector = await embedText(plainText)
      ;(updates as Record<string, unknown>).vector_embedding = JSON.stringify(vector)
    }
  }

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'ノートが見つかりません' }, { status: 404 })
  }

  // ToDo タグのノートなら TaskList アイテムを todos テーブルに再同期
  const noteTag = (updates.tag !== undefined ? updates.tag : data.tag) as string | null
  const contentForSync = updates.content ?? data.content
  if (noteTag === 'ToDo' && contentForSync) {
    // 既存 todos を削除して再挿入（差分管理より確実）
    await supabase.from('todos').delete().eq('note_id', params.id)
    const todos = extractTodosFromContent(contentForSync)
    if (todos.length > 0) {
      await supabase.from('todos').insert(
        todos.map((t) => ({
          note_id: params.id,
          content: t.content,
          is_done: t.is_done,
        })),
      )
    }
  }

  return NextResponse.json(data)
}

// DELETE /api/notes/[id] — 論理削除
export async function DELETE(_request: Request, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { error } = await supabase
    .from('notes')
    .update({ is_deleted: true })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
