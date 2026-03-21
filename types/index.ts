// =================================================
// Idec — 型定義
// DBスキーマ（supabase-setup.sql）と 1:1 対応
// =================================================

export type Plan = 'free' | 'pro'
export type AiType = 'rational' | 'balanced' | 'ethical'
export type NoteTag = 'アイデア' | '情報' | 'ToDo'
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived'

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
  goal: string
  deadline: string | null
  status: ProjectStatus
  progress_percent: number
  created_at: string
  updated_at: string
}

export interface CreateProjectInput {
  title: string
  description?: string
  goal?: string
  deadline?: string
  status?: ProjectStatus
}

export interface UpdateProjectInput {
  title?: string
  description?: string
  goal?: string
  deadline?: string | null
  status?: ProjectStatus
  progress_percent?: number
}

// ----- AiUsage -----

export interface AiUsage {
  id: string
  user_id: string
  year_month: string // 'YYYY-MM' 形式
  count: number
}

// ----- WallSession -----

export interface WallMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface WallSession {
  id: string
  user_id: string
  project_id: string | null
  ai_type: AiType
  messages: WallMessage[]
  summary: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ----- Roadmap -----

export interface Roadmap {
  id: string
  project_id: string
  note_id: string | null
  title: string
  steps: unknown[]
  image_url: string | null
  structured_text: string
  created_at: string
  updated_at: string
}

// ----- Discussion -----

export interface Discussion {
  id: string
  user_id: string
  project_id: string | null
  note_id: string | null
  title: string
  members: string[]
  invite_link: string | null
  invite_expires_at: string | null
  history_summary: string
  created_at: string
}

// ----- DiscussionMessage -----

export interface DiscussionMessage {
  id: string
  discussion_id: string
  user_id: string
  display_name: string
  content: string
  is_ai: boolean
  created_at: string
}

// ----- NoteScore -----

export interface NoteScore {
  id: string
  note_id: string
  user_id: string
  feasibility: number
  impact: number
  effort: number
  originality: number
  ai_comment: string
  scored_at: string
}

// ----- Template -----

export interface Template {
  id: string
  user_id: string | null
  title: string
  description: string
  content: TiptapContent
  category: string
  is_system: boolean
  created_at: string
  updated_at: string
}

// ----- NoteLink -----

export interface NoteLink {
  id: string
  source_note_id: string
  target_note_id: string
  user_id: string
  created_at: string
}

// ----- Incubation -----

export type IncubationStatus = 'incubating' | 'reviewed' | 'cancelled'

export interface Incubation {
  id: string
  note_id: string
  user_id: string
  start_date: string
  review_date: string
  status: IncubationStatus
  ai_review: Record<string, unknown> | null
  created_at: string
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
