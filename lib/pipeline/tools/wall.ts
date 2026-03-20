// =================================================
// 壁打ち パイプライン
// AI対話セッション（チャット型、履歴あり）
// =================================================

import { TOKEN_BUDGET, WALL_SESSION } from '../config'
import { searchNotesByVector, fetchSessionHistory } from '../retrieve'
import {
  notesToContextBlocks,
  sessionToContextBlocks,
  summarizeText,
} from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { executeOutputAction, incrementUsage } from '../output'
import type { WallInput, ToolResult, ReferencedNote } from '../types'
import type { WallMessage } from '@/types'

/** サマリー生成: コンテンツの先頭部分を抽出 */
const createSummary = (content: string, maxLength: number = 120): string => {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength).trimEnd() + '…'
}

export const runWall = async (
  input: WallInput
): Promise<ToolResult<{ reply: string; sessionId: string; referencedNotes: ReferencedNote[] }>> => {
  try {
    // 1. セッション履歴取得
    const session = await fetchSessionHistory({
      userId: input.userId,
      sessionId: input.sessionId,
      projectId: input.projectId,
    })

    // 2. 関連ノートをベクトル検索（ユーザーメッセージで）
    const searchResults = await searchNotesByVector({
      userId: input.userId,
      query: input.message,
      projectId: input.projectId,
      limit: 3,
    })

    // 3. 参照ノート情報を生成（Summary-First: サマリーを優先表示用に生成）
    const referencedNotes: ReferencedNote[] = searchResults.map((r) => ({
      noteId: r.noteId,
      title: r.title,
      summary: createSummary(r.content),
      similarity: r.similarity,
    }))

    // 4. コンテキスト組み立て
    const blocks = [
      ...sessionToContextBlocks(session, 20), // 履歴は高優先度
      ...notesToContextBlocks(searchResults, 10),
    ]
    const context = assembleContext(blocks, TOKEN_BUDGET.wall)

    // 5. AI呼び出し
    const response = await callAi({
      tool: 'wall',
      context,
      userMessage: input.message,
      aiType: input.aiType,
      customInstruction: input.customInstruction,
    })

    // 6. 使用回数カウント
    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    // 7. メッセージ追加
    const now = new Date().toISOString()
    const newMessages: WallMessage[] = [
      ...session.messages,
      { role: 'user', content: input.message, timestamp: now },
      { role: 'assistant', content: response.content, timestamp: now },
    ]

    // 8. 要約判定
    let summary = session.summary
    if (newMessages.length > WALL_SESSION.summarizeThreshold) {
      // 古いメッセージを要約
      const oldMessages = newMessages.slice(0, -WALL_SESSION.maxMessagesInContext)
      const oldText = oldMessages
        .map((m) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
        .join('\n')
      const existingSummary = summary ? `前回の要約:\n${summary}\n\n追加分:\n` : ''
      summary = await summarizeText(existingSummary + oldText, 500)
    }

    // 9. セッション保存
    let sessionId: string

    if (session.sessionId) {
      await executeOutputAction(input.userId, {
        type: 'update-session',
        sessionId: session.sessionId,
        messages: newMessages,
        summary,
      })
      sessionId = session.sessionId
    } else {
      const result = await executeOutputAction(input.userId, {
        type: 'create-session',
        userId: input.userId,
        projectId: input.projectId,
        aiType: input.aiType,
        messages: newMessages,
      })
      sessionId = result.id
    }

    return {
      success: true,
      data: { reply: response.content, sessionId, referencedNotes },
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
