import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNoteSchema } from '@/lib/validations/schemas'
import { embedText } from '@/lib/pgvector/embed'
import { tiptapToText } from '@/lib/utils/tiptap'
import { extractTodosFromContent } from '@/lib/utils/todo-sync'

// GET /api/notes — ノート一覧取得
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const tag = searchParams.get('tag')
  const userTag = searchParams.get('user_tag')
  const isArchived = searchParams.get('is_archived') === 'true'
  const isDeleted = searchParams.get('is_deleted') === 'true'

  let query = supabase
    .from('notes')
    .select('id, title, tag, user_tags, is_pinned, is_archived, is_deleted, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('is_archived', isArchived)
    .eq('is_deleted', isDeleted)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  if (tag) {
    query = query.eq('tag', tag)
  }

  if (userTag) {
    query = query.contains('user_tags', [userTag])
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/notes — ノート作成
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title, content, tag, user_tags, project_id, parent_note_id } = parsed.data

  // ベクトル埋め込み生成
  const plainText = `${title}\n${tiptapToText(content)}`
  const vector = await embedText(plainText)

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title,
      content,
      tag,
      user_tags,
      project_id: project_id ?? null,
      parent_note_id: parent_note_id ?? null,
      vector_embedding: JSON.stringify(vector),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ToDo タグ付きノートの場合、TaskList アイテムを todos テーブルに同期
  if (tag === 'ToDo' && data) {
    const todos = extractTodosFromContent(content)
    if (todos.length > 0) {
      await supabase.from('todos').insert(
        todos.map((t) => ({
          note_id: data.id,
          content: t.content,
          is_done: t.is_done,
        })),
      )
    }
  }

  return NextResponse.json(data, { status: 201 })
}
