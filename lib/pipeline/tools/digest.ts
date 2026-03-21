// =================================================
// デイリーダイジェスト パイプライン
// 過去24時間の活動をAIが要約し、今日やるべきことを提案
// =================================================

import { TOKEN_BUDGET } from '../config'
import { estimateTokens } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { incrementUsage } from '../output'
import { createClient } from '@/lib/supabase/server'
import type { DigestInput, ToolResult, ContextBlock } from '../types'

export const runDigest = async (
  input: DigestInput
): Promise<ToolResult<{ summary: string; suggestions: string[] }>> => {
  try {
    const supabase = createClient()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 過去24時間の活動を取得
    const [notesRes, projectsRes, todosRes] = await Promise.all([
      supabase
        .from('notes')
        .select('id, title, tag, created_at, updated_at')
        .eq('user_id', input.userId)
        .eq('is_deleted', false)
        .gte('updated_at', since)
        .order('updated_at', { ascending: false }),
      supabase
        .from('projects')
        .select('id, title, status, progress_percent, updated_at')
        .eq('user_id', input.userId)
        .gte('updated_at', since)
        .order('updated_at', { ascending: false }),
      supabase
        .from('todos')
        .select('id, content, is_done, created_at')
        .eq('is_done', false)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const notes = notesRes.data ?? []
    const projects = projectsRes.data ?? []
    const todos = todosRes.data ?? []

    const activityLines: string[] = []

    if (notes.length > 0) {
      activityLines.push('【更新されたノート】')
      notes.forEach((n) => activityLines.push(`- ${n.title}（${n.tag ?? 'タグなし'}）`))
    }

    if (projects.length > 0) {
      activityLines.push('\n【更新されたプロジェクト】')
      projects.forEach((p) => activityLines.push(`- ${p.title}（${p.status}, 進捗${p.progress_percent}%）`))
    }

    if (todos.length > 0) {
      activityLines.push('\n【未完了のToDo】')
      todos.forEach((t) => activityLines.push(`- ${t.content}`))
    }

    if (activityLines.length === 0) {
      return {
        success: true,
        data: {
          summary: '過去24時間の活動はありません。新しいノートやプロジェクトを作成してみましょう！',
          suggestions: ['新しいアイデアノートを作成する', 'プロジェクトの進捗を更新する'],
        },
        tokensUsed: 0,
        stubbed: false,
      }
    }

    const activityText = activityLines.join('\n')
    const block: ContextBlock = {
      role: 'retrieved',
      label: '過去24時間の活動',
      content: activityText,
      tokenEstimate: estimateTokens(activityText),
      priority: 10,
    }
    const context = assembleContext([block], TOKEN_BUDGET.digest)

    const response = await callAi({
      tool: 'digest',
      context,
      userMessage: [
        '上記の活動データを基に、以下の形式で今日のダイジェストを作成してください：',
        '',
        '1. 活動サマリー（3〜5行の要約）',
        '2. 今日の提案（3つの具体的なアクション）',
        '',
        '以下のJSON形式で返してください：',
        '{"summary": "サマリー文", "suggestions": ["提案1", "提案2", "提案3"]}',
      ].join('\n'),
      aiType: input.aiType,
    })

    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        success: true,
        data: { summary: response.content, suggestions: [] },
        tokensUsed: response.tokensUsed,
        stubbed: response.stubbed,
      }
    }

    const parsed = JSON.parse(jsonMatch[0]) as { summary: string; suggestions: string[] }

    return {
      success: true,
      data: {
        summary: parsed.summary || response.content,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      },
      tokensUsed: response.tokensUsed,
      stubbed: response.stubbed,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '不明なエラー',
      tokensUsed: 0,
      stubbed: true,
    }
  }
}
