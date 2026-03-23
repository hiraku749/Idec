// =================================================
// 文章増強 パイプライン
// ノートの文章をAIで増強・改善
// =================================================

import { TOKEN_BUDGET } from '../config'
import { fetchNote } from '../retrieve'
import { estimateTokens } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { executeOutputAction, incrementUsage } from '../output'
import type { EnhanceInput, ToolResult, ContextBlock } from '../types'

export const runEnhance = async (
  input: EnhanceInput
): Promise<ToolResult<{ enhanced: string; noteId: string }>> => {
  try {
    // 1. ノート取得
    const note = await fetchNote(input.userId, input.noteId)
    if (!note) {
      return {
        success: false,
        error: 'ノートが見つかりません',
        tokensUsed: 0,
        stubbed: true,
      }
    }

    // 2. コンテキスト組み立て
    const text = `【${note.title}】\n${note.content}`
    const block: ContextBlock = {
      role: 'retrieved',
      label: `対象ノート: ${note.title}`,
      content: text,
      tokenEstimate: estimateTokens(text),
      priority: 10,
    }
    const context = assembleContext([block], TOKEN_BUDGET.enhance)

    // 3. AI呼び出し
    const response = await callAi({
      tool: 'enhance',
      context,
      userMessage: 'この文章をより明確で読みやすく増強してください。元の意図を保ちつつ、表現を改善してください。',
      aiType: input.aiType,
      customInstruction: input.customInstruction,
    })

    // 4. 使用回数カウント
    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    // 5. 出力
    let noteId: string

    if (input.mode === 'replace') {
      await executeOutputAction(input.userId, {
        type: 'update-note',
        noteId: input.noteId,
        content: response.content,
      })
      noteId = input.noteId
    } else {
      const result = await executeOutputAction(input.userId, {
        type: 'create-note',
        title: `${note.title}（増強版）`,
        content: response.content,
      })
      noteId = result.id
    }

    return {
      success: true,
      data: { enhanced: response.content, noteId },
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
