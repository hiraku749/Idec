import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSwot } from '@/lib/pipeline'
import { z } from 'zod'

const swotSchema = z.object({
  noteId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  aiType: z
    .union([z.literal('rational'), z.literal('balanced'), z.literal('ethical')])
    .default('balanced'),
  customInstruction: z.string().max(500).optional(),
})

// POST /api/swot — SWOT分析生成
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = swotSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runSwot({
    userId: user.id,
    noteId: parsed.data.noteId,
    projectId: parsed.data.projectId,
    aiType: parsed.data.aiType,
    customInstruction: parsed.data.customInstruction,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
