import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runWall } from '@/lib/pipeline'
import { z } from 'zod'

const wallSchema = z.object({
  message: z.string().min(1, 'メッセージを入力してください').max(5000),
  sessionId: z.string().uuid().optional(),
  aiType: z.union([z.literal('rational'), z.literal('balanced'), z.literal('ethical')]).default('balanced'),
  projectId: z.string().uuid().optional(),
})

// POST /api/wall — 壁打ちメッセージ送信
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = wallSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runWall({
    userId: user.id,
    message: parsed.data.message,
    sessionId: parsed.data.sessionId,
    aiType: parsed.data.aiType,
    projectId: parsed.data.projectId,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}

// GET /api/wall — セッション一覧取得
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (sessionId) {
    // 特定セッション取得
    const { data, error } = await supabase
      .from('wall_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'セッションが見つかりません' }, { status: 404 })
    }
    return NextResponse.json(data)
  }

  // セッション一覧
  const { data, error } = await supabase
    .from('wall_sessions')
    .select('id, summary, ai_type, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
