// =================================================
// アイデアスコアリング パイプライン
// ノートに対して実現可能性・インパクト・労力・独自性の4軸でスコア付け
// =================================================

import { TOKEN_BUDGET } from '../config'
import { fetchNote } from '../retrieve'
import { estimateTokens } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { incrementUsage } from '../output'
import type { ScoringInput, ToolResult, ContextBlock } from '../types'

interface ScoreData {
  feasibility: number
  impact: number
  effort: number
  originality: number
  comment: string
}

export const runScoring = async (
  input: ScoringInput
): Promise<ToolResult<ScoreData>> => {
  try {
    const note = await fetchNote(input.userId, input.noteId)
    if (!note) {
      return { success: false, error: 'ノートが見つかりません', tokensUsed: 0, stubbed: true }
    }

    const text = `【${note.title}】\n${note.content}`
    const block: ContextBlock = {
      role: 'retrieved',
      label: `対象ノート: ${note.title}`,
      content: text,
      tokenEstimate: estimateTokens(text),
      priority: 10,
    }
    const context = assembleContext([block], TOKEN_BUDGET.scoring)

    const response = await callAi({
      tool: 'scoring',
      context,
      userMessage: [
        'このアイデアノートを以下の4軸で1〜5のスコアで評価し、JSON形式で返してください。',
        '',
        '1. feasibility（実現可能性）: 技術的・リソース的に実現可能か',
        '2. impact（インパクト）: 実現した場合の影響度・価値',
        '3. effort（労力）: 必要な時間・コスト（5=低労力、1=高労力）',
        '4. originality（独自性）: 既存のものとの差別化度',
        '',
        '以下のJSON形式のみを返してください（他のテキストは不要）:',
        '{"feasibility": 3, "impact": 4, "effort": 2, "originality": 5, "comment": "評価理由の説明"}',
      ].join('\n'),
      aiType: input.aiType,
    })

    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    // JSONをパース
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: 'AIからの応答をパースできませんでした', tokensUsed: response.tokensUsed, stubbed: response.stubbed }
    }

    const parsed = JSON.parse(jsonMatch[0]) as ScoreData
    const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v)))

    return {
      success: true,
      data: {
        feasibility: clamp(parsed.feasibility),
        impact: clamp(parsed.impact),
        effort: clamp(parsed.effort),
        originality: clamp(parsed.originality),
        comment: parsed.comment || '',
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
