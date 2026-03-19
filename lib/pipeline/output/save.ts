// =================================================
// 出力アクション実行（DB保存）
// =================================================

import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/pgvector/embed'
import type { OutputAction } from '../types'

/**
 * 出力アクションを実行してDBに保存
 */
export const executeOutputAction = async (
  userId: string,
  action: OutputAction
): Promise<{ id: string }> => {
  const supabase = createClient()

  switch (action.type) {
    case 'create-note': {
      // プレーンテキストをTiptapコンテンツに変換
      const tiptapContent = {
        type: 'doc',
        content: action.content.split('\n').map((line) => ({
          type: 'paragraph',
          content: line ? [{ type: 'text', text: line }] : [],
        })),
      }

      const vector = await embedText(`${action.title}\n${action.content}`)

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: userId,
          title: action.title,
          content: tiptapContent,
          tag: action.tag ?? null,
          project_id: action.projectId ?? null,
          vector_embedding: JSON.stringify(vector),
        })
        .select('id')
        .single()

      if (error) throw new Error(`ノート作成失敗: ${error.message}`)
      return { id: data.id }
    }

    case 'update-note': {
      const tiptapContent = {
        type: 'doc',
        content: action.content.split('\n').map((line) => ({
          type: 'paragraph',
          content: line ? [{ type: 'text', text: line }] : [],
        })),
      }

      const { error } = await supabase
        .from('notes')
        .update({ content: tiptapContent })
        .eq('id', action.noteId)
        .eq('user_id', userId)

      if (error) throw new Error(`ノート更新失敗: ${error.message}`)
      return { id: action.noteId }
    }

    case 'create-session': {
      const { data, error } = await supabase
        .from('wall_sessions')
        .insert({
          user_id: action.userId,
          project_id: action.projectId ?? null,
          ai_type: action.aiType,
          messages: action.messages,
        })
        .select('id')
        .single()

      if (error) throw new Error(`セッション作成失敗: ${error.message}`)
      return { id: data.id }
    }

    case 'update-session': {
      const updateData: Record<string, unknown> = {
        messages: action.messages,
      }
      if (action.summary !== undefined) {
        updateData.summary = action.summary
      }

      const { error } = await supabase
        .from('wall_sessions')
        .update(updateData)
        .eq('id', action.sessionId)

      if (error) throw new Error(`セッション更新失敗: ${error.message}`)
      return { id: action.sessionId }
    }

    case 'save-roadmap': {
      const { data, error } = await supabase
        .from('roadmaps')
        .insert({
          project_id: action.projectId,
          title: action.title,
          steps: action.steps,
          structured_text: action.structuredText,
        })
        .select('id')
        .single()

      if (error) throw new Error(`ロードマップ保存失敗: ${error.message}`)
      return { id: data.id }
    }
  }
}
