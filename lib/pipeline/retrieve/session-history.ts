// =================================================
// 壁打ちセッション履歴取得
// =================================================

import { createClient } from '@/lib/supabase/server'
import { WALL_SESSION } from '../config'
import type { WallMessage, AiType } from '@/types'
import type { SessionHistoryResult } from '../types'

/**
 * 壁打ちセッションの履歴を取得
 * コンテキスト用に直近メッセージと要約を返す
 */
export const fetchSessionHistory = async (params: {
  userId: string
  sessionId?: string
  projectId?: string | null
}): Promise<SessionHistoryResult> => {
  const { userId, sessionId } = params

  // 新規セッション
  if (!sessionId) {
    return {
      sessionId: null,
      messages: [],
      summary: '',
      aiType: 'balanced',
    }
  }

  const supabase = createClient()

  const { data } = await supabase
    .from('wall_sessions')
    .select('id, messages, summary, ai_type')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (!data) {
    return {
      sessionId: null,
      messages: [],
      summary: '',
      aiType: 'balanced',
    }
  }

  const allMessages = (data.messages as WallMessage[]) || []

  // コンテキストに含める直近メッセージのみ返す
  const recentMessages = allMessages.slice(-WALL_SESSION.maxMessagesInContext)

  return {
    sessionId: data.id,
    messages: recentMessages,
    summary: data.summary || '',
    aiType: data.ai_type as AiType,
  }
}
