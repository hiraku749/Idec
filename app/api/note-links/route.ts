import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createLinkSchema = z.object({
  sourceNoteId: z.string().uuid(),
  targetNoteId: z.string().uuid(),
})

const batchUpdateSchema = z.object({
  sourceNoteId: z.string().uuid(),
  targetNoteIds: z.array(z.string().uuid()),
})

// GET /api/note-links?noteId=xxx — ノートのリンク（前方+後方）を取得
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const noteId = searchParams.get('noteId')
  if (!noteId) {
    return NextResponse.json({ error: 'noteId is required' }, { status: 400 })
  }

  // 前方リンク（このノートが参照しているノート）のIDを取得
  const { data: forwardLinkRows, error: fErr } = await supabase
    .from('note_links')
    .select('target_note_id')
    .eq('source_note_id', noteId)
    .eq('user_id', user.id)

  if (fErr) {
    return NextResponse.json({ error: fErr.message }, { status: 500 })
  }

  // 後方リンク（このノートを参照しているノート）のIDを取得
  const { data: backLinkRows, error: bErr } = await supabase
    .from('note_links')
    .select('source_note_id')
    .eq('target_note_id', noteId)
    .eq('user_id', user.id)

  if (bErr) {
    return NextResponse.json({ error: bErr.message }, { status: 500 })
  }

  // 前方リンク先のノートタイトルを取得
  const forwardIds = (forwardLinkRows ?? []).map((r) => r.target_note_id)
  const backIds = (backLinkRows ?? []).map((r) => r.source_note_id)

  const [forwardNotes, backNotes] = await Promise.all([
    forwardIds.length > 0
      ? supabase.from('notes').select('id, title').in('id', forwardIds).eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    backIds.length > 0
      ? supabase.from('notes').select('id, title').in('id', backIds).eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  return NextResponse.json({
    forwardLinks: (forwardNotes.data ?? []).map((n) => ({
      noteId: n.id,
      title: n.title || '無題',
    })),
    backLinks: (backNotes.data ?? []).map((n) => ({
      noteId: n.id,
      title: n.title || '無題',
    })),
  })
}

// POST /api/note-links — リンク作成
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createLinkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.sourceNoteId === parsed.data.targetNoteId) {
    return NextResponse.json({ error: '自分自身にリンクはできません' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('note_links')
    .upsert(
      {
        source_note_id: parsed.data.sourceNoteId,
        target_note_id: parsed.data.targetNoteId,
        user_id: user.id,
      },
      { onConflict: 'source_note_id,target_note_id' },
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/note-links?sourceNoteId=xxx&targetNoteId=yyy — リンク削除
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sourceNoteId = searchParams.get('sourceNoteId')
  const targetNoteId = searchParams.get('targetNoteId')

  if (!sourceNoteId || !targetNoteId) {
    return NextResponse.json({ error: 'sourceNoteId と targetNoteId が必要です' }, { status: 400 })
  }

  const { error } = await supabase
    .from('note_links')
    .delete()
    .eq('source_note_id', sourceNoteId)
    .eq('target_note_id', targetNoteId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// PUT /api/note-links — バッチ更新（ノート保存時に [[]] をパースして一括更新）
export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = batchUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // 既存のリンクを削除
  await supabase
    .from('note_links')
    .delete()
    .eq('source_note_id', parsed.data.sourceNoteId)
    .eq('user_id', user.id)

  // 新しいリンクを挿入
  if (parsed.data.targetNoteIds.length > 0) {
    const links = parsed.data.targetNoteIds
      .filter((id) => id !== parsed.data.sourceNoteId)
      .map((targetId) => ({
        source_note_id: parsed.data.sourceNoteId,
        target_note_id: targetId,
        user_id: user.id,
      }))

    if (links.length > 0) {
      await supabase.from('note_links').insert(links)
    }
  }

  return NextResponse.json({ success: true })
}
