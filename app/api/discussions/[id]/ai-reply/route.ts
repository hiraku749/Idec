import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import type { DiscussionMessage } from '@/types'

// POST /api/discussions/[id]/ai-reply — AIがディスカッションに返答を投稿
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // ディスカッション取得
  const { data: discussion } = await supabase
    .from('discussions')
    .select('id, title, user_id, members')
    .eq('id', params.id)
    .single()

  if (!discussion) return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 })

  const isMember =
    discussion.user_id === user.id ||
    (discussion.members as string[]).includes(user.id)
  if (!isMember) return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })

  // 直近のメッセージを取得（最大20件）
  const { data: messages } = await supabase
    .from('discussion_messages')
    .select('display_name, content, is_ai, created_at')
    .eq('discussion_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const recentMessages = (messages ?? []).reverse() as Pick<
    DiscussionMessage,
    'display_name' | 'content' | 'is_ai'
  >[]

  if (recentMessages.length === 0) {
    return NextResponse.json({ error: 'まだメッセージがありません' }, { status: 400 })
  }

  // 会話履歴をテキスト化
  const conversationText = recentMessages
    .map((m) => `${m.is_ai ? '[AI]' : m.display_name}: ${m.content}`)
    .join('\n')

  // AIに返答を生成させる
  const apiKey = process.env.OPENAI_API_KEY
  let aiContent: string

  if (!apiKey) {
    aiContent = `（スタブ）ディスカッション「${discussion.title}」の議論を読みました。皆さんの意見は興味深いですね。`
  } else {
    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: [
            'あなたはディスカッションに参加するAIアシスタントです。',
            '参加者の議論を読み、建設的な意見・視点・提案を日本語で1〜3文で返してください。',
            '議論を深める質問や、見落とされている観点を指摘することも歓迎します。',
            '返答は簡潔にまとめ、断定的になりすぎず対話を促すトーンにしてください。',
          ].join('\n'),
        },
        {
          role: 'user',
          content: `ディスカッションのテーマ: ${discussion.title}\n\n直近の会話:\n${conversationText}\n\n上記の流れを受けて、AIとして参加者へ返答してください。`,
        },
      ],
    })

    aiContent = response.choices[0]?.message?.content ?? ''
  }

  // AIメッセージを投稿（is_ai: true）
  const { data: newMessage, error } = await supabase
    .from('discussion_messages')
    .insert({
      discussion_id: params.id,
      user_id: user.id,
      display_name: 'AI',
      content: aiContent,
      is_ai: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(newMessage, { status: 201 })
}
