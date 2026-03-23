// =================================================
// コンテキストツール パイプライン
// プロンプト作成支援・情報の簡潔化
// =================================================

import { TOKEN_BUDGET } from '../config'
import { fetchNotes } from '../retrieve'
import { estimateTokens } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { incrementUsage } from '../output'
import type { ContextToolInput, ToolResult, ContextBlock } from '../types'

const GOAL_PROMPTS: Record<ContextToolInput['goal'], string> = {
  'prompt-engineering':
    '以下の情報をもとに、AIへの効果的なプロンプトを作成してください。目的を明確に、コンテキストを簡潔に含めたプロンプトにしてください。',
  condense:
    '以下の情報を重要なポイントを失わずに、できるだけ簡潔にまとめてください。',
  restructure:
    '以下の情報を論理的な構造に再編成してください。見出し・箇条書きを使って読みやすくしてください。',
}

export const runContextTool = async (
  input: ContextToolInput
): Promise<ToolResult<{ result: string }>> => {
  try {
    // 1. ノートを取得
    const notes = await fetchNotes(input.userId, input.noteIds)

    if (notes.length === 0) {
      return {
        success: false,
        error: 'ノートが見つかりません',
        tokensUsed: 0,
        stubbed: true,
      }
    }

    // 2. コンテキストブロックに変換
    const blocks: ContextBlock[] = notes.map((note) => {
      const text = `【${note.title}】\n${note.content}`
      return {
        role: 'retrieved' as const,
        label: `ノート: ${note.title}`,
        content: text,
        tokenEstimate: estimateTokens(text),
        priority: 10,
      }
    })

    const context = assembleContext(blocks, TOKEN_BUDGET.context)

    // 3. AI呼び出し
    const prompt = GOAL_PROMPTS[input.goal]
    const response = await callAi({
      tool: 'context',
      context,
      userMessage: prompt,
      aiType: input.aiType ?? 'balanced',
      customInstruction: input.customInstruction,
    })

    // 4. 使用回数カウント
    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    return {
      success: true,
      data: { result: response.content },
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
