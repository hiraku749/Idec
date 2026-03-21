// =================================================
// パイプライン設定
// =================================================

/** ツールごとのトークン予算 */
export const TOKEN_BUDGET = {
  'own-ai': 4000,
  wall: 6000,
  context: 4000,
  enhance: 3000,
  diagram: 3000,
  roadmap: 5000,
  scoring: 3000,
  synthesis: 6000,
  digest: 4000,
  swot: 4000,
  incubator: 4000,
  opponent: 3000,
  simulator: 4000,
} as const

/** プランごとのAI使用回数上限（月あたり） */
export const PLAN_LIMITS = {
  free: 30,
  pro: 500,
} as const

/** ベクトル検索のデフォルト設定 */
export const VECTOR_SEARCH_DEFAULTS = {
  limit: 5,
  threshold: 0.3,
} as const

/** 壁打ちセッション設定 */
export const WALL_SESSION = {
  /** この件数を超えたら古いメッセージを要約する */
  summarizeThreshold: 20,
  /** コンテキストに含める直近メッセージ数 */
  maxMessagesInContext: 10,
} as const
