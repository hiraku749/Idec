// =================================================
// トークン推定・テキスト切り詰め
// =================================================

/**
 * テキストのトークン数を推定する
 * 日本語は1文字 ≈ 1.5トークン、英語は4文字 ≈ 1トークンの近似
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  // 日本語文字数を検出
  const japaneseChars = (text.match(/[\u3000-\u9fff\uf900-\ufaff]/g) || []).length
  const otherChars = text.length - japaneseChars
  return Math.ceil(japaneseChars * 1.5 + otherChars / 4)
}

/**
 * テキストをトークン予算内に切り詰める
 */
export function truncateToTokenBudget(
  text: string,
  maxTokens: number,
  strategy: 'tail' | 'head' = 'tail'
): string {
  const current = estimateTokens(text)
  if (current <= maxTokens) return text

  // 目安の文字数比率で切り詰め
  const ratio = maxTokens / current
  const targetLength = Math.floor(text.length * ratio * 0.95) // 5%マージン

  if (strategy === 'tail') {
    // 末尾を残す（古い部分をカット）
    return '…' + text.slice(text.length - targetLength)
  }
  // 先頭を残す（新しい部分をカット）
  return text.slice(0, targetLength) + '…'
}
