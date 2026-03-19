// =================================================
// 直接データ取得
// =================================================

import { createClient } from '@/lib/supabase/server'
import { tiptapToText } from '@/lib/utils/tiptap'
import type { TiptapContent, Project } from '@/types'
import type { DirectFetchResult } from '../types'

/**
 * 指定ノートを取得しプレーンテキスト化
 */
export const fetchNote = async (
  userId: string,
  noteId: string
): Promise<DirectFetchResult | null> => {
  const supabase = createClient()

  const { data } = await supabase
    .from('notes')
    .select('id, title, content')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single()

  if (!data) return null

  return {
    noteId: data.id,
    title: data.title,
    content: tiptapToText(data.content as TiptapContent),
  }
}

/**
 * 複数ノートを一括取得
 */
export const fetchNotes = async (
  userId: string,
  noteIds: string[]
): Promise<DirectFetchResult[]> => {
  if (noteIds.length === 0) return []
  const supabase = createClient()

  const { data } = await supabase
    .from('notes')
    .select('id, title, content')
    .eq('user_id', userId)
    .in('id', noteIds)

  if (!data) return []

  return data.map((row) => ({
    noteId: row.id,
    title: row.title,
    content: tiptapToText(row.content as TiptapContent),
  }))
}

/**
 * プロジェクトとそれに紐づくノート群を取得
 */
export const fetchProjectWithNotes = async (
  userId: string,
  projectId: string
): Promise<{ project: Project; notes: DirectFetchResult[] } | null> => {
  const supabase = createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (!project) return null

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, content')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  return {
    project: project as Project,
    notes: (notes ?? []).map((row) => ({
      noteId: row.id,
      title: row.title,
      content: tiptapToText(row.content as TiptapContent),
    })),
  }
}
