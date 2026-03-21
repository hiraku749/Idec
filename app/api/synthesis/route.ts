import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSynthesis } from '@/lib/pipeline'
import { z } from 'zod'

const synthesisSchema = z.object({
  noteIds: z.array(z.string().uuid()).min(2).max(5),
  aiType: z
    .union([z.literal('rational'), z.literal('balanced'), z.literal('ethical')])
    .default('balanced'),
})

// POST /api/synthesis — アイデア統合
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = synthesisSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runSynthesis({
    userId: user.id,
    noteIds: parsed.data.noteIds,
    aiType: parsed.data.aiType,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
