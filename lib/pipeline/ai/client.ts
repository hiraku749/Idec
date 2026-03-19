// =================================================
// AIクライアント（スタブ）
// =================================================

import type { AiRequest, AiResponse } from '../types'

/**
 * AI呼び出し
 * ANTHROPIC_API_KEY が設定されていない場合はスタブレスポンスを返す
 */
export const callAi = async (request: AiRequest): Promise<AiResponse> => {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return createStubResponse(request)
  }

  // TODO: Anthropic SDK を使った実際のAI呼び出し
  // lib/claude/ に実装を配置し、ここから呼び出す
  return createStubResponse(request)
}

/**
 * スタブレスポンス生成
 * コンテキストが正しく組み立てられていることを確認するためのデバッグ情報付き
 */
const createStubResponse = (request: AiRequest): AiResponse => {
  const contextSummary = request.context.blocks
    .map((b) => `  [${b.role}] ${b.label} (${b.tokenEstimate}トークン)`)
    .join('\n')

  const content = [
    `[スタブ応答] ツール: ${request.tool}`,
    `AI人格: ${request.aiType}`,
    `ユーザーメッセージ: ${request.userMessage}`,
    `コンテキストブロック数: ${request.context.blocks.length}`,
    `合計トークン: ${request.context.totalTokens}`,
    `切り詰め発生: ${request.context.truncated ? 'はい' : 'いいえ'}`,
    '',
    'コンテキスト内容:',
    contextSummary || '  (なし)',
  ].join('\n')

  return {
    content,
    tokensUsed: 0,
    model: 'stub',
    stubbed: true,
  }
}
