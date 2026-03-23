import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runIncubator } from '@/lib/pipeline'
import { z } from 'zod'

const startSchema = z.object({
  noteId: z.string().uuid(),
  days: z.number().int().min(1).max(30).default(7),
})

const reviewSchema = z.object({
  incubationId: z.string().uuid(),
  aiType: z
    .union([z.literal('rational'), z.literal('balanced'), z.literal('ethical')])
    .default('balanced'),
  customInstruction: z.string().max(500).optional(),
})

// GET /api/incubator — インキュベーション一覧
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'incubating'

  const { data, error } = await supabase
    .from('incubations')
    .select('*, notes!inner(id, title)')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('review_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

// POST /api/incubator — インキュベーション開始 or レビュー実行
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()

  // レビュー実行の場合
  if (body.incubationId) {
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // インキュベーション取得
    const { data: incubation } = await supabase
      .from('incubations')
      .select('*')
      .eq('id', parsed.data.incubationId)
      .eq('user_id', user.id)
      .single()

    if (!incubation) {
      return NextResponse.json({ error: 'インキュベーションが見つかりません' }, { status: 404 })
    }

    const result = await runIncubator({
      userId: user.id,
      noteId: incubation.note_id,
      aiType: parsed.data.aiType,
      customInstruction: parsed.data.customInstruction,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // ステータス更新
    await supabase
      .from('incubations')
      .update({ status: 'reviewed', ai_review: result.data })
      .eq('id', parsed.data.incubationId)

    return NextResponse.json(result.data)
  }

  // インキュベーション開始の場合
  const parsed = startSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const reviewDate = new Date()
  reviewDate.setDate(reviewDate.getDate() + parsed.data.days)

  const { data, error } = await supabase
    .from('incubations')
    .insert({
      note_id: parsed.data.noteId,
      user_id: user.id,
      review_date: reviewDate.toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
