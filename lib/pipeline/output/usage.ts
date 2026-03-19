// =================================================
// AI使用回数トラッキング
// =================================================

import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '../config'
import type { Plan } from '@/types'

/**
 * AI使用回数をインクリメントし、制限内かどうかを返す
 */
export const incrementUsage = async (
  userId: string
): Promise<{ count: number; allowed: boolean }> => {
  const supabase = createClient()
  const yearMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  // 現在のカウントを取得
  const { data: existing } = await supabase
    .from('ai_usage')
    .select('id, count')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .single()

  let count: number

  if (existing) {
    // 更新
    count = existing.count + 1
    await supabase
      .from('ai_usage')
      .update({ count })
      .eq('id', existing.id)
  } else {
    // 新規作成
    count = 1
    await supabase
      .from('ai_usage')
      .insert({ user_id: userId, year_month: yearMonth, count })
  }

  // ユーザーのプランを取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  const plan = (profile?.plan ?? 'free') as Plan
  const limit = PLAN_LIMITS[plan]
  const allowed = count <= limit

  return { count, allowed }
}

/**
 * 使用回数を確認（インクリメントなし）
 */
export const checkUsage = async (
  userId: string
): Promise<{ count: number; allowed: boolean; limit: number }> => {
  const supabase = createClient()
  const yearMonth = new Date().toISOString().slice(0, 7)

  const { data: usage } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  const plan = (profile?.plan ?? 'free') as Plan
  const limit = PLAN_LIMITS[plan]
  const count = usage?.count ?? 0

  return { count, allowed: count < limit, limit: limit === Infinity ? -1 : limit }
}
