import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { tiptapToText } from '@/lib/utils/tiptap'
import { tiptapToMarkdown } from '@/lib/utils/export'
import type { TiptapContent } from '@/types'

// GET /api/export?noteId=xxx&format=markdown|text|html
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const noteId = searchParams.get('noteId')
  const format = searchParams.get('format') ?? 'markdown'

  if (!noteId) {
    return NextResponse.json({ error: 'noteId is required' }, { status: 400 })
  }

  const { data: note, error } = await supabase
    .from('notes')
    .select('id, title, content, tag, created_at, updated_at')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single()

  if (error || !note) {
    return NextResponse.json({ error: 'ノートが見つかりません' }, { status: 404 })
  }

  const content = note.content as TiptapContent
  const title = note.title || '無題'

  switch (format) {
    case 'text': {
      const text = `${title}\n${'='.repeat(title.length)}\n\n${tiptapToText(content)}`
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.txt"`,
        },
      })
    }

    case 'html': {
      const plainText = tiptapToText(content)
      const html = [
        '<!DOCTYPE html>',
        '<html lang="ja"><head><meta charset="utf-8">',
        `<title>${title}</title>`,
        '<style>body{font-family:sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.8}h1{border-bottom:2px solid #333;padding-bottom:0.5rem}</style>',
        '</head><body>',
        `<h1>${title}</h1>`,
        `<p style="color:#666;font-size:0.9rem">作成日: ${note.created_at} | 更新日: ${note.updated_at}</p>`,
        plainText.split('\n').map((line) => `<p>${line || '&nbsp;'}</p>`).join('\n'),
        '</body></html>',
      ].join('\n')

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.html"`,
        },
      })
    }

    case 'markdown':
    default: {
      const md = tiptapToMarkdown(content, title)
      return new NextResponse(md, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.md"`,
        },
      })
    }
  }
}
