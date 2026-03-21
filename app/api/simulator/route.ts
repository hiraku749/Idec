import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSimulator } from '@/lib/pipeline'
import { z } from 'zod'

const simulatorSchema = z.object({
  persona: z.string().min(1).max(500),
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.union([z.literal('user'), z.literal('assistant')]),
    content: z.string(),
  })).default([]),
})

// POST /api/simulator — AIシミュレーター
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const parsed = simulatorSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const result = await runSimulator({
    userId: user.id,
    persona: parsed.data.persona,
    message: parsed.data.message,
    history: parsed.data.history,
  })

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result.data)
}
