// =================================================
// Idec — 型定義
// DBスキーマ（supabase-setup.sql）と 1:1 対応
// =================================================

export type Plan = 'free' | 'pro'
export type AiType = 'rational' | 'balanced' | 'ethical'
export type NoteTag = 'アイデア' | '情報' | 'ToDo'

// ----- Profile -----

export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  plan: Plan
  default_ai_type: AiType
  dark_mode: boolean
  created_at: string
}

// ----- Note -----

export interface Note {
  id: string
  user_id: string
  project_id: string | null
  parent_note_id: string | null
  title: string
  content: TiptapContent
  tag: NoteTag | null
  user_tags: string[]
  is_pinned: boolean
  is_archived: boolean
  is_deleted: boolean
  version_history: TiptapContent[]
  vector_embedding: number[] | null
  created_at: string
  updated_at: string
}

// Tiptap エディタが出力する JSON 形式
export type TiptapContent = Record<string, unknown>

// ----- Todo -----

export interface Todo {
  id: string
  note_id: string
  content: string
  is_done: boolean
  reminder_at: string | null
  created_at: string
}

// ----- Project -----

export interface Project {
  id: string
  user_id: string
  title: string
  description: string
  progress_percent: number
  created_at: string
  updated_at: string
}

// ----- AiUsage -----

export interface AiUsage {
  id: string
  user_id: string
  year_month: string // 'YYYY-MM' 形式
  count: number
}

// ----- API レスポンス型 -----

export interface ApiError {
  error: string
}

// ノート一覧取得のクエリパラメータ
export interface NotesQuery {
  search?: string
  tag?: NoteTag
  is_pinned?: boolean
  is_archived?: boolean
  is_deleted?: boolean
  project_id?: string
}

// ノート作成のリクエストボディ
export interface CreateNoteInput {
  title: string
  content: TiptapContent
  tag?: NoteTag
  user_tags?: string[]
  project_id?: string
  parent_note_id?: string
}

// ノート更新のリクエストボディ
export interface UpdateNoteInput {
  title?: string
  content?: TiptapContent
  tag?: NoteTag | null
  user_tags?: string[]
  is_pinned?: boolean
  is_archived?: boolean
  is_deleted?: boolean
  project_id?: string | null
}
