// =================================================
// 図式化 パイプライン
// ノート内容を構造化テキスト・図に変換
// =================================================

import { TOKEN_BUDGET } from '../config'
import { fetchNote } from '../retrieve'
import { estimateTokens } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { incrementUsage } from '../output'
import type { DiagramInput, ToolResult, ContextBlock } from '../types'

const FORMAT_PROMPTS: Record<DiagramInput['format'], string> = {
  mermaid:
    'この内容をMermaid記法のダイアグラムに変換してください。フローチャート、シーケンス図、マインドマップなど最適な形式を選んでください。',
  'markdown-outline':
    'この内容をMarkdownのアウトライン形式（見出し・箇条書き）に構造化してください。',
  'structured-text':
    'この内容を論理的な構造に整理し、セクション分けした構造化テキストにしてください。',
}

export const runDiagram = async (
  input: DiagramInput
): Promise<ToolResult<{ output: string; format: string }>> => {
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
    const context = assembleContext([block], TOKEN_BUDGET.diagram)

    // 3. AI呼び出し
    const response = await callAi({
      tool: 'diagram',
      context,
      userMessage: FORMAT_PROMPTS[input.format],
      aiType: input.aiType ?? 'rational',
      customInstruction: input.customInstruction,
    })

    // 4. 使用回数カウント
    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    return {
      success: true,
      data: { output: response.content, format: input.format },
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
