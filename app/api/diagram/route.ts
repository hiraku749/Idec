import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runDiagram } from '@/lib/pipeline'
import { z } from 'zod'

const diagramSchema = z.object({
  noteId: z.string().uuid(),
  format: z.union([
    z.literal('mermaid'),
    z.literal('markdown-outline'),
    z.literal('structured-text'),
  ]),
})

// POST /api/diagram — 図式生成
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = diagramSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runDiagram({
    userId: user.id,
    noteId: parsed.data.noteId,
    format: parsed.data.format,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
