// =================================================
// OwnAI エージェント パイプライン
// ノートをナレッジとして質問→回答（RAG型）
// =================================================

import { TOKEN_BUDGET } from '../config'
import { searchNotesByVector } from '../retrieve'
import { notesToContextBlocks } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { executeOutputAction, incrementUsage } from '../output'
import type { OwnAiInput, ToolResult, ReferencedNote } from '../types'

/** サマリー生成: コンテンツの先頭部分を抽出 */
const createSummary = (content: string, maxLength: number = 120): string => {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength).trimEnd() + '…'
}

export const runOwnAi = async (
  input: OwnAiInput
): Promise<ToolResult<{ answer: string; noteId?: string; referencedNotes: ReferencedNote[] }>> => {
  try {
    // 1. 関連ノートをベクトル検索
    const searchResults = await searchNotesByVector({
      userId: input.userId,
      query: input.query,
      projectId: input.projectId,
    })

    // 2. 参照ノート情報を生成（Summary-First）
    const referencedNotes: ReferencedNote[] = searchResults.map((r) => ({
      noteId: r.noteId,
      title: r.title,
      summary: createSummary(r.content),
      similarity: r.similarity,
    }))

    // 3. コンテキストブロックに変換・組み立て
    const blocks = notesToContextBlocks(searchResults, 10)
    const context = assembleContext(blocks, TOKEN_BUDGET['own-ai'])

    // 4. AI呼び出し
    const response = await callAi({
      tool: 'own-ai',
      context,
      userMessage: input.query,
      aiType: input.aiType,
      customInstruction: input.customInstruction,
    })

    // 5. 使用回数カウント
    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    // 6. ノートに保存（オプション）
    let noteId: string | undefined
    if (input.saveAsNote) {
      const result = await executeOutputAction(input.userId, {
        type: 'create-note',
        title: `AI回答: ${input.query.slice(0, 50)}`,
        content: response.content,
        tag: '情報',
        projectId: input.projectId,
      })
      noteId = result.id
    }

    return {
      success: true,
      data: { answer: response.content, noteId, referencedNotes },
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
