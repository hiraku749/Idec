import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runEnhance } from '@/lib/pipeline'
import { z } from 'zod'

const enhanceSchema = z.object({
  noteId: z.string().uuid(),
  aiType: z
    .union([z.literal('rational'), z.literal('balanced'), z.literal('ethical')])
    .default('balanced'),
  mode: z
    .union([z.literal('replace'), z.literal('new-note')])
    .default('new-note'),
})

// POST /api/enhance — 文章増強
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = enhanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runEnhance({
    userId: user.id,
    noteId: parsed.data.noteId,
    aiType: parsed.data.aiType,
    mode: parsed.data.mode,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
