// =================================================
// AIクライアント（Anthropic Claude API）
// =================================================

import Anthropic from '@anthropic-ai/sdk'
import type { AiRequest, AiResponse } from '../types'

/** AI人格ごとのシステムプロンプト */
const SYSTEM_PROMPTS: Record<string, string> = {
  rational: [
    'あなたはIdecの分析的AIアシスタントです。',
    'ユーザーの質問に対して論理的・客観的に回答してください。',
    '根拠やデータを重視し、曖昧さを排除した回答を心がけてください。',
    '日本語で回答してください。',
  ].join('\n'),
  balanced: [
    'あなたはIdecのAIアシスタントです。',
    'ユーザーの質問に対して、論理性と共感性のバランスを取った回答をしてください。',
    '具体的で実用的な提案を心がけてください。',
    '日本語で回答してください。',
  ].join('\n'),
  ethical: [
    'あなたはIdecの倫理的AIアシスタントです。',
    'ユーザーの質問に対して、社会的影響や倫理的観点を考慮した回答をしてください。',
    '多角的な視点を提示し、慎重な判断を促してください。',
    '日本語で回答してください。',
  ].join('\n'),
}

/**
 * AI呼び出し
 * ANTHROPIC_API_KEY が設定されていない場合はスタブレスポンスを返す
 */
export const callAi = async (request: AiRequest): Promise<AiResponse> => {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return createStubResponse(request)
  }

  try {
    const client = new Anthropic({ apiKey })

    // コンテキストブロックをメッセージに変換
    const contextText = request.context.blocks
      .map((b) => `【${b.label}】\n${b.content}`)
      .join('\n\n')

    const systemPrompt = SYSTEM_PROMPTS[request.aiType] ?? SYSTEM_PROMPTS.balanced

    const systemContent = contextText
      ? `${systemPrompt}\n\n以下はユーザーのナレッジベースから取得した関連情報です。回答の参考にしてください：\n\n${contextText}`
      : systemPrompt

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemContent,
      messages: [{ role: 'user', content: request.userMessage }],
    })

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    return {
      content,
      tokensUsed: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
      model: response.model,
      stubbed: false,
    }
  } catch (err) {
    // APIエラー時はスタブにフォールバック
    console.error('[callAi] Anthropic API error:', err)
    return createStubResponse(request)
  }
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
