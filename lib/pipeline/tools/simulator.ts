// =================================================
// AIシミュレーター パイプライン
// ペルソナを設定してAIがなりきり対話する
// =================================================

import { TOKEN_BUDGET } from '../config'
import { assembleContext } from '../context'
import { estimateTokens } from '../transform'
import { callAi } from '../ai'
import { incrementUsage } from '../output'
import type { SimulatorInput, ToolResult, ContextBlock } from '../types'

export const runSimulator = async (
  input: SimulatorInput
): Promise<ToolResult<{ reply: string }>> => {
  try {
    // 会話履歴をコンテキストに含める
    const historyText = input.history.length > 0
      ? input.history
          .map((m) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
          .join('\n')
      : ''

    const blocks: ContextBlock[] = []

    if (historyText) {
      blocks.push({
        role: 'history',
        label: 'これまでの会話',
        content: historyText,
        tokenEstimate: estimateTokens(historyText),
        priority: 8,
      })
    }

    const context = assembleContext(blocks, TOKEN_BUDGET.simulator)

    // ペルソナをシステムプロンプトに組み込む形でuserMessageに含める
    const systemPrompt = `あなたは以下のペルソナになりきって会話します。キャラクターを一切崩さず、そのペルソナとして自然に返答してください。

【ペルソナ設定】
${input.persona}

上記のペルソナとして、ユーザーのメッセージに返答してください。`

    const response = await callAi({
      tool: 'simulator',
      context,
      userMessage: `${systemPrompt}\n\nユーザーのメッセージ: ${input.message}`,
      aiType: 'balanced',
    })

    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    return {
      success: true,
      data: { reply: response.content },
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
