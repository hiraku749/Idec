import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runOwnAi } from '@/lib/pipeline'
import { z } from 'zod'

const agentSchema = z.object({
  query: z.string().min(1, '質問を入力してください').max(5000),
  aiType: z.union([z.literal('rational'), z.literal('balanced'), z.literal('ethical')]).default('balanced'),
  projectId: z.string().uuid().optional(),
  saveAsNote: z.boolean().optional().default(false),
  customInstruction: z.string().max(1000).optional(),
})

// POST /api/agent — OwnAI質問
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = agentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runOwnAi({
    userId: user.id,
    query: parsed.data.query,
    aiType: parsed.data.aiType,
    projectId: parsed.data.projectId,
    saveAsNote: parsed.data.saveAsNote,
    customInstruction: parsed.data.customInstruction,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
