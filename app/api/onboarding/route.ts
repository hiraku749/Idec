import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PROFESSION_PACKS } from '@/lib/profession-packs'
import { embedText } from '@/lib/pgvector/embed'
import { tiptapToText } from '@/lib/utils/tiptap'
import { z } from 'zod'

const schema = z.object({
  profession: z.string().min(1).max(100),
  packId: z.string().optional(), // 対応するパックID（なければテンプレなし）
})

// POST /api/onboarding — 職業を保存してナレッジパックをインポート
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

  const { profession, packId } = parsed.data

  // profiles を更新（職業 + オンボーディング完了フラグ）
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ profession, onboarding_done: true })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 対応パックがあればノートをインポート
  let imported = 0
  if (packId) {
    const pack = PROFESSION_PACKS.find((p) => p.id === packId)
    if (pack) {
      for (const note of pack.notes) {
        const plainText = `${note.title}\n${tiptapToText(note.content)}`
        const vector = await embedText(plainText)
        await supabase.from('notes').insert({
          user_id: user.id,
          title: note.title,
          content: note.content,
          tag: note.tag,
          vector_embedding: JSON.stringify(vector),
        })
        imported++
      }
    }
  }

  return NextResponse.json({ success: true, imported })
}
