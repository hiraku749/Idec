import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: { id: string } }

// POST /api/notes/[id]/restore — ゴミ箱から復元
export async function POST(_request: Request, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('notes')
    .update({ is_deleted: false })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'ノートが見つかりません' }, { status: 404 })
  }

  return NextResponse.json(data)
}
