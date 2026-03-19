// =================================================
// テキスト要約（AI未接続時はスタブ）
// =================================================

import { truncateToTokenBudget } from './truncate'

/**
 * テキストを要約する
 * AI未接続時は先頭を切り詰めたテキストを返す
 */
export const summarizeText = async (
  text: string,
  maxTokens: number
): Promise<string> => {
  // TODO: ANTHROPIC_API_KEY が設定されたら AI による要約に切り替え
  // 現在はスタブ：先頭を切り詰めて返す
  return truncateToTokenBudget(text, maxTokens, 'head')
}
