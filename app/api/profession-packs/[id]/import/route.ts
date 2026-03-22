import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PROFESSION_PACKS } from '@/lib/profession-packs'
import { embedText } from '@/lib/pgvector/embed'
import { tiptapToText } from '@/lib/utils/tiptap'

// POST /api/profession-packs/[id]/import — パックをノートとしてインポート
export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const pack = PROFESSION_PACKS.find((p) => p.id === params.id)
  if (!pack) {
    return NextResponse.json({ error: 'パックが見つかりません' }, { status: 404 })
  }

  const created: string[] = []

  for (const note of pack.notes) {
    const plainText = `${note.title}\n${tiptapToText(note.content)}`
    const vector = await embedText(plainText)

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content,
        tag: note.tag,
        vector_embedding: JSON.stringify(vector),
      })
      .select('id')
      .single()

    if (!error && data) {
      created.push(data.id as string)
    }
  }

  return NextResponse.json({ imported: created.length, noteIds: created }, { status: 201 })
}
