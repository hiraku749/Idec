import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const joinSchema = z.object({
  token: z.string().min(1),
})

// POST /api/discussions/join — 招待トークンで参加
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data: discussion } = await supabase
    .from('discussions')
    .select('id, members, invite_token, invite_expires_at')
    .eq('invite_token', parsed.data.token)
    .single()

  if (!discussion) return NextResponse.json({ error: '招待リンクが無効です' }, { status: 404 })

  // 有効期限チェック
  if (discussion.invite_expires_at && new Date(discussion.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: '招待リンクの有効期限が切れています' }, { status: 410 })
  }

  const members = discussion.members as string[]
  if (members.includes(user.id)) {
    return NextResponse.json({ discussionId: discussion.id }) // すでに参加中
  }

  const { error } = await supabase
    .from('discussions')
    .update({ members: [...members, user.id] })
    .eq('id', discussion.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ discussionId: discussion.id })
}
