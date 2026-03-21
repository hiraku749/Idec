import type { AiType, WallMessage } from '@/types'

// =================================================
// パイプライン型定義
// =================================================

/** パイプラインを利用するツール名 */
export type ToolName = 'own-ai' | 'wall' | 'context' | 'enhance' | 'diagram' | 'roadmap' | 'scoring' | 'synthesis' | 'digest' | 'swot' | 'incubator' | 'opponent' | 'simulator'

// ----- Context Assembly -----

/** コンテキストの1ブロック（ノート、セッション履歴などの単位） */
export interface ContextBlock {
  role: 'system' | 'user' | 'retrieved' | 'history'
  label: string
  content: string
  tokenEstimate: number
  priority: number // 高いほど優先的に残す
}

/** 組み立て済みコンテキスト */
export interface AssembledContext {
  blocks: ContextBlock[]
  totalTokens: number
  truncated: boolean
}

// ----- Retrieval -----

export interface VectorSearchParams {
  userId: string
  query: string
  limit?: number
  projectId?: string | null
  threshold?: number
}

export interface VectorSearchResult {
  noteId: string
  title: string
  content: string // プレーンテキスト変換済み
  similarity: number
}

export interface DirectFetchResult {
  noteId: string
  title: string
  content: string
}

export interface SessionHistoryResult {
  sessionId: string | null
  messages: WallMessage[]
  summary: string
  aiType: AiType
}

// ----- AI -----

export interface AiRequest {
  tool: ToolName
  context: AssembledContext
  userMessage: string
  aiType: AiType
  customInstruction?: string
}

export interface AiResponse {
  content: string
  tokensUsed: number
  model: string
  stubbed: boolean
}

// ----- Output -----

export type OutputAction =
  | { type: 'create-note'; title: string; content: string; tag?: string; projectId?: string }
  | { type: 'update-note'; noteId: string; content: string }
  | { type: 'create-session'; userId: string; projectId?: string; aiType: AiType; messages: WallMessage[] }
  | { type: 'update-session'; sessionId: string; messages: WallMessage[]; summary?: string }
  | { type: 'save-roadmap'; projectId: string; title: string; steps: unknown[]; structuredText: string }

// ----- Tool I/O -----

export interface OwnAiInput {
  userId: string
  query: string
  aiType: AiType
  projectId?: string
  saveAsNote?: boolean
  customInstruction?: string
}

export interface WallInput {
  userId: string
  message: string
  sessionId?: string
  projectId?: string
  aiType: AiType
  customInstruction?: string
}

/** AIが参照したノートの要約情報 */
export interface ReferencedNote {
  noteId: string
  title: string
  summary: string
  similarity: number
}

export interface EnhanceInput {
  userId: string
  noteId: string
  aiType: AiType
  mode: 'replace' | 'new-note'
}

export interface DiagramInput {
  userId: string
  noteId: string
  format: 'mermaid' | 'markdown-outline' | 'structured-text'
}

export interface ContextToolInput {
  userId: string
  noteIds: string[]
  goal: 'prompt-engineering' | 'condense' | 'restructure'
}

export interface RoadmapInput {
  userId: string
  projectId: string
  aiType: AiType
}

export interface ScoringInput {
  userId: string
  noteId: string
  aiType: AiType
}

export interface SynthesisInput {
  userId: string
  noteIds: string[]
  aiType: AiType
}

export interface DigestInput {
  userId: string
  aiType: AiType
}

export interface SwotInput {
  userId: string
  noteId: string
  projectId?: string
  aiType: AiType
}

export interface IncubatorInput {
  userId: string
  noteId: string
  aiType: AiType
}

export type OpponentRole =
  | 'marketer'
  | 'engineer'
  | 'executive'
  | 'consumer'
  | 'investor'

export interface OpponentInput {
  userId: string
  noteId: string
  role: OpponentRole
}

export interface SimulatorMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SimulatorInput {
  userId: string
  persona: string
  message: string
  history: SimulatorMessage[]
}

/** 全ツール共通の実行結果 */
export interface ToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  tokensUsed: number
  stubbed: boolean
}
