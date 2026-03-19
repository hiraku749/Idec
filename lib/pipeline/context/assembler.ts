// =================================================
// コンテキスト組み立て
// =================================================

import type { ContextBlock, AssembledContext } from '../types'
import { truncateToTokenBudget, estimateTokens } from '../transform/truncate'

/**
 * コンテキストブロックをトークン予算内に組み立てる
 *
 * 1. priority 降順にソート
 * 2. 予算内に収まるブロックを順番に追加
 * 3. 最後のブロックが予算を超える場合は切り詰め
 */
export const assembleContext = (
  blocks: ContextBlock[],
  tokenBudget: number
): AssembledContext => {
  const sorted = [...blocks].sort((a, b) => b.priority - a.priority)
  const result: ContextBlock[] = []
  let remaining = tokenBudget
  let truncated = false

  for (const block of sorted) {
    if (remaining <= 0) {
      truncated = true
      break
    }

    if (block.tokenEstimate <= remaining) {
      result.push(block)
      remaining -= block.tokenEstimate
    } else {
      // 予算内に切り詰めて追加
      const truncatedContent = truncateToTokenBudget(block.content, remaining, 'head')
      result.push({
        ...block,
        content: truncatedContent,
        tokenEstimate: estimateTokens(truncatedContent),
      })
      remaining = 0
      truncated = true
    }
  }

  return {
    blocks: result,
    totalTokens: tokenBudget - remaining,
    truncated,
  }
}
