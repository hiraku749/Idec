import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runOpponent } from '@/lib/pipeline'
import { z } from 'zod'

const opponentSchema = z.object({
  noteId: z.string().uuid(),
  role: z.union([
    z.literal('marketer'),
    z.literal('engineer'),
    z.literal('executive'),
    z.literal('consumer'),
    z.literal('investor'),
  ]),
})

// POST /api/opponent — AI反対者
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const parsed = opponentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const result = await runOpponent({
    userId: user.id,
    noteId: parsed.data.noteId,
    role: parsed.data.role,
  })

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result.data)
}
