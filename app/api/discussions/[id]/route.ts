import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/discussions/[id] — ルーム詳細 + メッセージ一覧
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data: discussion, error: dErr } = await supabase
    .from('discussions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (dErr || !discussion) return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 })

  // メンバーチェック
  const isMember =
    discussion.user_id === user.id ||
    (discussion.members as string[]).includes(user.id)
  if (!isMember) return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })

  const { data: messages, error: mErr } = await supabase
    .from('discussion_messages')
    .select('*')
    .eq('discussion_id', params.id)
    .order('created_at', { ascending: true })

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  return NextResponse.json({ discussion, messages })
}
