import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  displayName: z.string().min(1).max(50).default('名無し'),
})

// POST /api/discussions/[id]/messages — メッセージ送信
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // メンバー確認
  const { data: discussion } = await supabase
    .from('discussions')
    .select('user_id, members')
    .eq('id', params.id)
    .single()

  if (!discussion) return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 })

  const isMember =
    discussion.user_id === user.id ||
    (discussion.members as string[]).includes(user.id)
  if (!isMember) return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })

  const body = await request.json()
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('discussion_messages')
    .insert({
      discussion_id: params.id,
      user_id: user.id,
      display_name: parsed.data.displayName,
      content: parsed.data.content,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
