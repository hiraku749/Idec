import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  transcript: z.string().min(1).max(50000),
})

// POST /api/meeting-summary — 会議文字起こしをAIで要約
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { transcript } = parsed.data

  const message = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `以下は会議の音声を文字起こしした内容です。日本語で構造化されたメモを作成してください。

文字起こし:
${transcript}

以下のJSON形式で出力してください:
{
  "title": "会議タイトル（内容から推定。例: 週次ミーティング、企画MTG等）",
  "summary": "会議の概要（3〜5文）",
  "decisions": ["決定事項1", "決定事項2"],
  "actionItems": ["アクションアイテム1（担当者: ）", "アクションアイテム2"],
  "nextSteps": "次のステップ・懸念点"
}`,
      },
    ],
  })

  const raw = message.choices[0]?.message?.content ?? ''
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as {
      title: string
      summary: string
      decisions: string[]
      actionItems: string[]
      nextSteps: string
    }

    // Tiptap JSON形式のノートコンテンツを構築
    const content = {
      type: 'doc',
      content: [
        {
          type: 'callout',
          attrs: { emoji: '🎤' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '会議録音より自動生成' }] }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: data.summary }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '決定事項' }],
        },
        {
          type: 'bulletList',
          content: data.decisions.map((d) => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: d }] }],
          })),
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'アクションアイテム' }],
        },
        {
          type: 'bulletList',
          content: data.actionItems.map((a) => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: a }] }],
          })),
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '次のステップ' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: data.nextSteps }],
        },
      ],
    }

    return NextResponse.json({ title: data.title, summary: content })
  } catch {
    // パース失敗時はシンプルなテキストで返す
    return NextResponse.json({ title: '会議メモ', summary: raw })
  }
}
