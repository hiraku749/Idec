import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
})

// POST /api/ocr — 画像からテキストを抽出
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

  const { imageBase64, mediaType } = parsed.data

  const message = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${imageBase64}`,
            },
          },
          {
            type: 'text',
            text: `この画像に含まれるすべてのテキストを読み取り、そのまま出力してください。
画像がスクリーンショットや図表の場合は、テキスト内容に加えて図の説明も簡潔に追加してください。
マークダウン形式（見出し・リストなど）を使って読みやすく整形してください。
テキストが読み取れない場合や画像にテキストがない場合は「テキストなし」と返してください。`,
          },
        ],
      },
    ],
  })

  const text = message.choices[0]?.message?.content ?? ''

  return NextResponse.json({ text })
}
