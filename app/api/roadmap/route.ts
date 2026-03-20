import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runRoadmap } from '@/lib/pipeline'
import { z } from 'zod'

const roadmapSchema = z.object({
  projectId: z.string().uuid(),
  aiType: z.union([z.literal('rational'), z.literal('balanced'), z.literal('ethical')]).default('balanced'),
})

// POST /api/roadmap — ロードマップ生成
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = roadmapSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runRoadmap({
    userId: user.id,
    projectId: parsed.data.projectId,
    aiType: parsed.data.aiType,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
