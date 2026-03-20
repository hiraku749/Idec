import { describe, it, expect } from 'vitest'
import { callAi } from './client'
import type { AiRequest, AssembledContext } from '../types'

function makeRequest(overrides: Partial<AiRequest> = {}): AiRequest {
  const context: AssembledContext = {
    blocks: [
      {
        role: 'user',
        label: 'ユーザー入力',
        content: 'テスト',
        tokenEstimate: 5,
        priority: 1,
      },
    ],
    totalTokens: 5,
    truncated: false,
  }
  return {
    tool: 'own-ai',
    context,
    userMessage: 'テストメッセージ',
    aiType: 'balanced',
    ...overrides,
  }
}

describe('callAi', () => {
  it('ANTHROPIC_API_KEY未設定時はスタブ応答を返す', async () => {
    const response = await callAi(makeRequest())
    expect(response.stubbed).toBe(true)
    expect(response.model).toBe('stub')
    expect(response.tokensUsed).toBe(0)
  })

  it('スタブ応答にはツール名とコンテキスト情報が含まれる', async () => {
    const response = await callAi(makeRequest({ tool: 'wall' }))
    expect(response.content).toContain('wall')
    expect(response.content).toContain('コンテキストブロック数: 1')
  })

  it('スタブ応答にAI人格が含まれる', async () => {
    const response = await callAi(makeRequest({ aiType: 'rational' }))
    expect(response.content).toContain('rational')
  })
})
