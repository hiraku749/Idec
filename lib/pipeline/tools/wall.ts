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
import type { WallInput, ToolResult } from '../types'
import type { WallMessage } from '@/types'

export const runWall = async (
  input: WallInput
): Promise<ToolResult<{ reply: string; sessionId: string }>> => {
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

    // 3. コンテキスト組み立て
    const blocks = [
      ...sessionToContextBlocks(session, 20), // 履歴は高優先度
      ...notesToContextBlocks(searchResults, 10),
    ]
    const context = assembleContext(blocks, TOKEN_BUDGET.wall)

    // 4. AI呼び出し
    const response = await callAi({
      tool: 'wall',
      context,
      userMessage: input.message,
      aiType: input.aiType,
    })

    // 5. 使用回数カウント
    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    // 6. メッセージ追加
    const now = new Date().toISOString()
    const newMessages: WallMessage[] = [
      ...session.messages,
      { role: 'user', content: input.message, timestamp: now },
      { role: 'assistant', content: response.content, timestamp: now },
    ]

    // 7. 要約判定
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

    // 8. セッション保存
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
      data: { reply: response.content, sessionId },
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
