import { describe, it, expect } from 'vitest'
import { estimateTokens, truncateToTokenBudget } from './truncate'

describe('estimateTokens', () => {
  it('空文字列は0トークン', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('英語テキストは4文字で約1トークン', () => {
    const text = 'abcd' // 4文字 → 1トークン
    expect(estimateTokens(text)).toBe(1)
  })

  it('日本語テキストは1文字で約1.5トークン', () => {
    const text = 'あいう' // 3文字 → 4.5 → 切り上げ5
    expect(estimateTokens(text)).toBe(5)
  })

  it('日本語と英語の混合テキスト', () => {
    const text = 'こんにちはhello' // 5日本語(7.5) + 5英語(1.25) = 8.75 → 9
    expect(estimateTokens(text)).toBe(9)
  })
})

describe('truncateToTokenBudget', () => {
  it('予算内ならそのまま返す', () => {
    const text = 'short text'
    expect(truncateToTokenBudget(text, 100)).toBe(text)
  })

  it('head戦略で先頭を残して切り詰める', () => {
    const text = 'a'.repeat(1000)
    const result = truncateToTokenBudget(text, 10, 'head')
    expect(result.length).toBeLessThan(text.length)
    expect(result.endsWith('…')).toBe(true)
  })

  it('tail戦略で末尾を残して切り詰める', () => {
    const text = 'a'.repeat(1000)
    const result = truncateToTokenBudget(text, 10, 'tail')
    expect(result.length).toBeLessThan(text.length)
    expect(result.startsWith('…')).toBe(true)
  })
})
