// =================================================
// AI反対者 パイプライン
// 指定した役職の視点でノートを批評する
// =================================================

import { TOKEN_BUDGET } from '../config'
import { fetchNote } from '../retrieve'
import { estimateTokens } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { incrementUsage } from '../output'
import type { OpponentInput, OpponentRole, ToolResult, ContextBlock } from '../types'

const ROLE_LABELS: Record<OpponentRole, string> = {
  marketer: 'マーケター',
  engineer: 'エンジニア',
  executive: '経営者',
  consumer: '消費者',
  investor: '投資家',
}

const ROLE_PROMPTS: Record<OpponentRole, string> = {
  marketer:
    'あなたはベテランのマーケターです。市場性・顧客ニーズ・競合優位性・プロモーション戦略の観点から、以下のアイデアや計画を批評してください。改善すべき点を具体的に指摘してください。',
  engineer:
    'あなたは経験豊富なエンジニアです。技術的実現可能性・スケーラビリティ・セキュリティ・開発コストの観点から、以下のアイデアや計画を批評してください。技術的な懸念点を具体的に指摘してください。',
  executive:
    'あなたは企業の経営者です。ROI・リスク管理・組織リソース・戦略的整合性の観点から、以下のアイデアや計画を批評してください。経営判断として問題になる点を具体的に指摘してください。',
  consumer:
    'あなたは一般的な消費者です。使いやすさ・価格・価値・日常での有用性の観点から、以下のアイデアや計画を批評してください。ユーザー目線での疑問点や不満を具体的に指摘してください。',
  investor:
    'あなたは投資家です。市場規模・収益性・競合参入障壁・スケーラビリティ・Exit戦略の観点から、以下のアイデアや計画を批評してください。投資対象として懸念される点を具体的に指摘してください。',
}

export const runOpponent = async (
  input: OpponentInput
): Promise<ToolResult<{ critique: string; role: string }>> => {
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
    const context = assembleContext([block], TOKEN_BUDGET.opponent)

    const response = await callAi({
      tool: 'opponent',
      context,
      userMessage: ROLE_PROMPTS[input.role],
      aiType: 'rational',
    })

    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    return {
      success: true,
      data: { critique: response.content, role: ROLE_LABELS[input.role] },
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
