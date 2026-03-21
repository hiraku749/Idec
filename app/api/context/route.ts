import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runContextTool } from '@/lib/pipeline'
import { z } from 'zod'

const contextSchema = z.object({
  noteIds: z.array(z.string().uuid()).min(1, 'ノートを1つ以上選択してください').max(10),
  goal: z.union([
    z.literal('prompt-engineering'),
    z.literal('condense'),
    z.literal('restructure'),
  ]),
})

// POST /api/context — コンテキストエンジニアリング
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = contextSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runContextTool({
    userId: user.id,
    noteIds: parsed.data.noteIds,
    goal: parsed.data.goal,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
