import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/pgvector/embed'
import { tiptapToText } from '@/lib/utils/tiptap'

const schema = z.object({
  note_id: z.string().uuid(),
})

// POST /api/embed — ノートのベクトル埋め込みを（再）生成して保存
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: note, error: fetchError } = await supabase
    .from('notes')
    .select('id, title, content')
    .eq('id', parsed.data.note_id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !note) {
    return NextResponse.json({ error: 'ノートが見つかりません' }, { status: 404 })
  }

  const plainText = `${note.title}\n${tiptapToText(note.content)}`
  const vector = await embedText(plainText)

  const { error: updateError } = await supabase
    .from('notes')
    .update({ vector_embedding: JSON.stringify(vector) })
    .eq('id', note.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
