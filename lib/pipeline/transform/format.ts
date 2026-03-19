// =================================================
// データ → ContextBlock 変換
// =================================================

import { tiptapToText } from '@/lib/utils/tiptap'
import type { TiptapContent, Project } from '@/types'
import type { ContextBlock, VectorSearchResult, SessionHistoryResult } from '../types'
import { estimateTokens } from './truncate'

/**
 * ベクトル検索結果をコンテキストブロックに変換
 */
export const notesToContextBlocks = (
  notes: VectorSearchResult[],
  priority: number
): ContextBlock[] =>
  notes.map((note, i) => {
    const text = `【${note.title}】\n${note.content}`
    return {
      role: 'retrieved' as const,
      label: `関連ノート ${i + 1}（類似度: ${(note.similarity * 100).toFixed(0)}%）`,
      content: text,
      tokenEstimate: estimateTokens(text),
      priority,
    }
  })

/**
 * セッション履歴をコンテキストブロックに変換
 */
export const sessionToContextBlocks = (
  session: SessionHistoryResult,
  priority: number
): ContextBlock[] => {
  const blocks: ContextBlock[] = []

  // 要約がある場合
  if (session.summary) {
    blocks.push({
      role: 'history',
      label: '過去の会話要約',
      content: session.summary,
      tokenEstimate: estimateTokens(session.summary),
      priority: priority + 1, // 要約は直近メッセージより優先
    })
  }

  // 直近メッセージ
  if (session.messages.length > 0) {
    const text = session.messages
      .map((m) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
      .join('\n')
    blocks.push({
      role: 'history',
      label: '直近の会話',
      content: text,
      tokenEstimate: estimateTokens(text),
      priority,
    })
  }

  return blocks
}

/**
 * プロジェクト情報をコンテキストブロックに変換
 */
export const projectToContextBlock = (
  project: Project,
  priority: number
): ContextBlock => {
  const text = `プロジェクト: ${project.title}\n説明: ${project.description}\n進捗: ${project.progress_percent}%`
  return {
    role: 'retrieved',
    label: 'プロジェクト情報',
    content: text,
    tokenEstimate: estimateTokens(text),
    priority,
  }
}

/**
 * ノートのTiptapContentをプレーンテキストに変換してコンテキストブロック化
 */
export const noteToContextBlock = (
  title: string,
  content: TiptapContent,
  priority: number
): ContextBlock => {
  const plain = tiptapToText(content)
  const text = `【${title}】\n${plain}`
  return {
    role: 'retrieved',
    label: `ノート: ${title}`,
    content: text,
    tokenEstimate: estimateTokens(text),
    priority,
  }
}
