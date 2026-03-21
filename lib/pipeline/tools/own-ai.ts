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

// =================================================
// [LP撮影用・一時的なデモ返答] ※撮影後に削除すること
// =================================================
const DEMO_REPLIES: { match: RegExp; answer: string; notes: ReferencedNote[] }[] = [
  {
    match: /今日やること/,
    answer: 'ノートが見つかりました！今日やることは、上司とのミーティングと、買い出しと勉強です！',
    notes: [{ noteId: 'demo-1', title: '今日のToDo', summary: '上司とのミーティング、買い出し、勉強', similarity: 0.97 }],
  },
  {
    match: /マーケティング|前のプロジェクト/,
    answer: '二年度前期マーケティング施策のことですね。あなたは昔、SNSを用いた施策に興味を示していました。深掘りしますか？',
    notes: [{ noteId: 'demo-2', title: '二年度前期マーケティング施策', summary: 'SNSを用いた施策に関するメモ', similarity: 0.94 }],
  },
]

export const runOwnAi = async (
  input: OwnAiInput
): Promise<ToolResult<{ answer: string; noteId?: string; referencedNotes: ReferencedNote[] }>> => {
  // [LP撮影用] デモ返答チェック
  for (const demo of DEMO_REPLIES) {
    if (demo.match.test(input.query)) {
      return { success: true, data: { answer: demo.answer, referencedNotes: demo.notes }, tokensUsed: 0, stubbed: false }
    }
  }

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
