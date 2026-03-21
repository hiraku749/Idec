import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAi } from '@/lib/pipeline/ai'
import { assembleContext } from '@/lib/pipeline/context'
import { estimateTokens } from '@/lib/pipeline/transform'

// POST /api/discussions/[id]/summarize — AI による会話要約
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // メンバー確認
  const { data: discussion } = await supabase
    .from('discussions')
    .select('user_id, members, title')
    .eq('id', params.id)
    .single()

  if (!discussion) return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 })

  const isMember =
    discussion.user_id === user.id ||
    (discussion.members as string[]).includes(user.id)
  if (!isMember) return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })

  // 全メッセージ取得
  const { data: messages } = await supabase
    .from('discussion_messages')
    .select('display_name, content, created_at')
    .eq('discussion_id', params.id)
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'まだメッセージがありません' }, { status: 400 })
  }

  // メッセージをテキスト化
  const transcript = messages
    .map((m) => `[${m.display_name}]: ${m.content}`)
    .join('\n')

  const contextText = `ディスカッション「${discussion.title}」の会話履歴:\n\n${transcript}`
  const context = assembleContext(
    [{
      role: 'retrieved',
      label: '会話履歴',
      content: contextText,
      tokenEstimate: estimateTokens(contextText),
      priority: 10,
    }],
    2000
  )

  const response = await callAi({
    tool: 'own-ai',
    context,
    userMessage: 'この会話の要点・決定事項・次のアクションを簡潔に箇条書きでまとめてください。',
    aiType: 'balanced',
  })

  // 要約をDBに保存
  await supabase
    .from('discussions')
    .update({ history_summary: response.content })
    .eq('id', params.id)

  return NextResponse.json({ summary: response.content })
}
