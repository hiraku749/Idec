import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const inviteSchema = z.object({
  expiresInHours: z.number().int().min(1).max(168).default(24), // 最大7日
})

// POST /api/discussions/[id]/invite — 招待リンク生成
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // 作成者のみ招待可能
  const { data: discussion } = await supabase
    .from('discussions')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (!discussion) return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 })
  if (discussion.user_id !== user.id) {
    return NextResponse.json({ error: '招待リンクを生成できるのはルーム作成者のみです' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + parsed.data.expiresInHours * 60 * 60 * 1000)

  const { error } = await supabase
    .from('discussions')
    .update({ invite_token: token, invite_expires_at: expiresAt.toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ token, expiresAt: expiresAt.toISOString() })
}
