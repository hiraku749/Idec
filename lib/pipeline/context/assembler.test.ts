import { describe, it, expect } from 'vitest'
import { assembleContext } from './assembler'
import type { ContextBlock } from '../types'

function makeBlock(overrides: Partial<ContextBlock> = {}): ContextBlock {
  return {
    role: 'user',
    label: 'test',
    content: 'テスト内容',
    tokenEstimate: 10,
    priority: 1,
    ...overrides,
  }
}

describe('assembleContext', () => {
  it('空のブロック配列は空の結果を返す', () => {
    const result = assembleContext([], 100)
    expect(result.blocks).toHaveLength(0)
    expect(result.totalTokens).toBe(0)
    expect(result.truncated).toBe(false)
  })

  it('予算内のブロックはすべて含まれる', () => {
    const blocks = [
      makeBlock({ label: 'a', tokenEstimate: 20, priority: 1 }),
      makeBlock({ label: 'b', tokenEstimate: 30, priority: 2 }),
    ]
    const result = assembleContext(blocks, 100)
    expect(result.blocks).toHaveLength(2)
    expect(result.totalTokens).toBe(50)
    expect(result.truncated).toBe(false)
  })

  it('優先度の高いブロックが先に含まれる', () => {
    const blocks = [
      makeBlock({ label: 'low', tokenEstimate: 60, priority: 1 }),
      makeBlock({ label: 'high', tokenEstimate: 60, priority: 10 }),
    ]
    const result = assembleContext(blocks, 70)
    // priority=10 のブロックが先に追加される
    expect(result.blocks[0].label).toBe('high')
    expect(result.truncated).toBe(true)
  })

  it('予算超過時にtruncatedがtrueになる', () => {
    const blocks = [
      makeBlock({ tokenEstimate: 50, priority: 2 }),
      makeBlock({ tokenEstimate: 50, priority: 1 }),
    ]
    const result = assembleContext(blocks, 60)
    expect(result.truncated).toBe(true)
  })

  it('最後のブロックが予算を超える場合は切り詰めて追加する', () => {
    const longContent = 'あ'.repeat(200) // 推定300トークン
    const blocks = [
      makeBlock({ label: 'first', tokenEstimate: 10, priority: 2 }),
      makeBlock({ label: 'long', content: longContent, tokenEstimate: 300, priority: 1 }),
    ]
    const result = assembleContext(blocks, 50)
    expect(result.blocks).toHaveLength(2)
    expect(result.blocks[1].content.length).toBeLessThan(longContent.length)
    expect(result.truncated).toBe(true)
  })
})
