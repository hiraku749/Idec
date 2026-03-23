// =================================================
// AIクライアント（OpenAI GPT-4o API）
// =================================================

import OpenAI from 'openai'
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
 * OPENAI_API_KEY が設定されていない場合はスタブレスポンスを返す
 */
export const callAi = async (request: AiRequest): Promise<AiResponse> => {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return createStubResponse(request)
  }

  try {
    const client = new OpenAI({ apiKey })

    // コンテキストブロックをメッセージに変換
    const contextText = request.context.blocks
      .map((b) => `【${b.label}】\n${b.content}`)
      .join('\n\n')

    // カスタム人格のシステムプロンプトがあれば優先、なければデフォルト
    const systemPrompt = request.systemPromptOverride
      ?? SYSTEM_PROMPTS[request.aiType]
      ?? SYSTEM_PROMPTS.balanced

    // カスタム指示文があれば追加
    const customPart = request.customInstruction
      ? `\n\n【ユーザーからの追加指示】\n${request.customInstruction}`
      : ''

    const systemContent = contextText
      ? `${systemPrompt}${customPart}\n\n以下はユーザーのナレッジベースから取得した関連情報です。回答の参考にしてください：\n\n${contextText}`
      : `${systemPrompt}${customPart}`

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: request.userMessage },
      ],
    })

    const content = response.choices[0]?.message?.content ?? ''

    return {
      content,
      tokensUsed: (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0),
      model: response.model,
      stubbed: false,
    }
  } catch (err) {
    // APIエラー時はスタブにフォールバック
    console.error('[callAi] OpenAI API error:', err)
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
