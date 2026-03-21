import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runScoring } from '@/lib/pipeline'
import { z } from 'zod'

const scoringSchema = z.object({
  noteId: z.string().uuid(),
  aiType: z
    .union([z.literal('rational'), z.literal('balanced'), z.literal('ethical')])
    .default('balanced'),
})

// POST /api/scoring — アイデアスコアリング
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = scoringSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runScoring({
    userId: user.id,
    noteId: parsed.data.noteId,
    aiType: parsed.data.aiType,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // スコアをDBに保存
  const { error: dbError } = await supabase
    .from('note_scores')
    .upsert({
      note_id: parsed.data.noteId,
      user_id: user.id,
      feasibility: result.data!.feasibility,
      impact: result.data!.impact,
      effort: result.data!.effort,
      originality: result.data!.originality,
      ai_comment: result.data!.comment,
      scored_at: new Date().toISOString(),
    }, { onConflict: 'note_id' })

  if (dbError) {
    // upsertが失敗した場合はinsertを試す（onConflictにユニーク制約がない場合）
    await supabase.from('note_scores').insert({
      note_id: parsed.data.noteId,
      user_id: user.id,
      feasibility: result.data!.feasibility,
      impact: result.data!.impact,
      effort: result.data!.effort,
      originality: result.data!.originality,
      ai_comment: result.data!.comment,
    })
  }

  return NextResponse.json(result.data)
}

// GET /api/scoring?noteId=xxx — スコア取得
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const noteId = searchParams.get('noteId')

  if (noteId) {
    const { data } = await supabase
      .from('note_scores')
      .select('*')
      .eq('note_id', noteId)
      .eq('user_id', user.id)
      .order('scored_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json(data ?? null)
  }

  // noteId未指定時は全スコアを返す
  const { data } = await supabase
    .from('note_scores')
    .select('*, notes!inner(title)')
    .eq('user_id', user.id)
    .order('scored_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
