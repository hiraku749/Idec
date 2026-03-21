import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(100),
  projectId: z.string().uuid().optional(),
  noteId: z.string().uuid().optional(),
})

// GET /api/discussions — 参加中のディスカッション一覧
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data, error } = await supabase
    .from('discussions')
    .select('*')
    .or(`user_id.eq.${user.id},members.cs.{${user.id}}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/discussions — ディスカッション作成
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('discussions')
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      project_id: parsed.data.projectId ?? null,
      note_id: parsed.data.noteId ?? null,
      members: [user.id],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
