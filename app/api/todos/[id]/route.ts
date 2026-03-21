import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/todos/[id] — Todoを完了にする
export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // 自分のTodoであることを確認してから更新
  const { data, error } = await supabase
    .from('todos')
    .update({ is_done: true })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Todoが見つかりません' }, { status: 404 })

  return NextResponse.json(data)
}
