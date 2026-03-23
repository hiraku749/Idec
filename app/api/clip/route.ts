import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  url: z.string().url(),
})

// URLからテキストを抽出するユーティリティ
async function fetchPageText(url: string): Promise<{ title: string; text: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; IdecBot/1.0)',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const html = await res.text()

  // タイトル抽出
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : ''

  // 本文テキスト抽出（簡易版：タグを除去）
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const body = bodyMatch ? bodyMatch[1] : html
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000) // トークン節約

  return { title, text }
}

// POST /api/clip — URLからノートを生成
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'URLが不正です' }, { status: 400 })
  }

  const { url } = parsed.data

  // ページを取得
  let title = ''
  let pageText = ''
  try {
    const page = await fetchPageText(url)
    title = page.title
    pageText = page.text
  } catch {
    return NextResponse.json({ error: 'ページを取得できませんでした。URLが正しいか確認してください。' }, { status: 422 })
  }

  // GPT-4o でサマリー生成
  const message = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `以下のWebページの内容を日本語で要約してノートを作成してください。

URL: ${url}
タイトル: ${title}

ページ本文:
${pageText}

以下の形式で出力してください（JSONで）:
{
  "title": "ノートのタイトル（元タイトルを参考に簡潔に）",
  "summary": "3〜5文の要約",
  "keyPoints": ["要点1", "要点2", "要点3"]
}`,
      },
    ],
  })

  const raw = message.choices[0]?.message?.content ?? ''
  let parsed2: { title: string; summary: string; keyPoints: string[] }
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed2 = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as typeof parsed2
  } catch {
    return NextResponse.json({ error: 'AI応答の解析に失敗しました' }, { status: 500 })
  }

  // Tiptap JSON コンテンツ生成
  const content = {
    type: 'doc',
    content: [
      {
        type: 'callout',
        attrs: { emoji: '🔗' },
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'ソース: ' },
              {
                type: 'text',
                marks: [{ type: 'link', attrs: { href: url } }],
                text: url,
              },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: parsed2.summary }],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '要点' }],
      },
      {
        type: 'bulletList',
        content: parsed2.keyPoints.map((point) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: point }] }],
        })),
      },
    ],
  }

  return NextResponse.json({
    title: parsed2.title || title,
    content,
    sourceUrl: url,
  })
}
