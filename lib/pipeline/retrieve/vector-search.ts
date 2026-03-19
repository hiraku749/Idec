// =================================================
// ベクトル類似検索
// =================================================

import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/pgvector/embed'
import { tiptapToText } from '@/lib/utils/tiptap'
import { VECTOR_SEARCH_DEFAULTS } from '../config'
import type { VectorSearchParams, VectorSearchResult } from '../types'
import type { TiptapContent } from '@/types'

/**
 * ユーザーのノートをベクトル類似検索する
 *
 * 1. クエリをベクトル化
 * 2. Supabase RPC `match_notes` を呼び出す
 * 3. 結果をプレーンテキストに変換して返す
 */
export const searchNotesByVector = async (
  params: VectorSearchParams
): Promise<VectorSearchResult[]> => {
  const {
    userId,
    query,
    limit = VECTOR_SEARCH_DEFAULTS.limit,
    projectId,
    threshold = VECTOR_SEARCH_DEFAULTS.threshold,
  } = params

  // クエリをベクトル化（APIキーなしならゼロベクトル → 結果なし）
  const queryEmbedding = await embedText(query)
  const isZeroVector = queryEmbedding.every((v) => v === 0)
  if (isZeroVector) {
    // ベクトル化できない場合はタイトル検索にフォールバック
    return fallbackTitleSearch(userId, query, limit, projectId)
  }

  const supabase = createClient()

  const { data, error } = await supabase.rpc('match_notes', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: threshold,
    match_count: limit,
    filter_user_id: userId,
  })

  if (error || !data) {
    // RPCが未定義の場合もフォールバック
    return fallbackTitleSearch(userId, query, limit, projectId)
  }

  return (data as Array<{ id: string; title: string; content: TiptapContent; similarity: number }>).map(
    (row) => ({
      noteId: row.id,
      title: row.title,
      content: tiptapToText(row.content),
      similarity: row.similarity,
    })
  )
}

/** ベクトル検索不可時のフォールバック：タイトル部分一致検索 */
const fallbackTitleSearch = async (
  userId: string,
  query: string,
  limit: number,
  projectId?: string | null
): Promise<VectorSearchResult[]> => {
  const supabase = createClient()

  let q = supabase
    .from('notes')
    .select('id, title, content')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .ilike('title', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (projectId) {
    q = q.eq('project_id', projectId)
  }

  const { data } = await q
  if (!data) return []

  return data.map((row) => ({
    noteId: row.id,
    title: row.title,
    content: tiptapToText(row.content as TiptapContent),
    similarity: 0.5, // フォールバック検索の固定類似度
  }))
}
