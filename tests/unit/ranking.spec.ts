import { describe, expect, it } from 'vitest'
import { makeAnalysis, market } from '@/mocks/fixtures'
import { rankOdds } from '@/features/odds/rank'
import { rankFunding } from '@/features/funding/rank'
import { AnalysisSchema } from '@/shared/contracts/analysis'

describe('可比较报价', () => {
  it('排除不同盘口、半场、滚球、不同规则与不可用报价', () => {
    const data = makeAnalysis()
    const quote = data.odds[0]!
    const incompatible = [
      { ...quote, merchantId: 'line', market: { ...market, line: '-0.5' }, decimalOdds: 9 },
      { ...quote, merchantId: 'half', market: { ...market, period: 'first-half' }, decimalOdds: 9 },
      {
        ...quote,
        merchantId: 'live',
        market: { ...market, phase: 'live' as const },
        decimalOdds: 9,
      },
      {
        ...quote,
        merchantId: 'rules',
        market: { ...market, settlementRuleId: 'other' },
        decimalOdds: 9,
      },
      { ...quote, merchantId: 'stale', freshness: 'stale' as const, decimalOdds: 9 },
      { ...quote, merchantId: 'restricted', eligible: false, decimalOdds: 9 },
    ]
    expect(rankOdds([...data.odds, ...incompatible], market).map((q) => q.merchantId)).toEqual([
      'A',
      'B',
      'C',
    ])
  })
  it('相同赔率并列', () => {
    const data = makeAnalysis()
    data.odds[1]!.decimalOdds = data.odds[0]!.decimalOdds
    expect(rankOdds(data.odds, market).map((q) => q.rank)).toEqual([1, 1, 3])
  })
})
describe('资金排名', () => {
  it('缺失、样本不足和过期数据不排名', () => {
    const rows = makeAnalysis().funding.rows
    rows[0]!.withdrawal.medianSeconds = null
    rows[1]!.withdrawal.sampleCount = 2
    rows[2]!.freshness = 'stale'
    expect(rankFunding(rows, 30)).toEqual([])
  })
  it('入金快慢不改变出金排序', () => {
    const rows = makeAnalysis().funding.rows
    rows[0]!.deposit.medianSeconds = 1
    expect(rankFunding(rows, 30).map((r) => r.merchantId)).toEqual(['B', 'A', 'C'])
  })
})
describe('运行时契约', () => {
  it('演示场景符合契约', () => {
    for (const scenario of ['normal', 'partial', 'stale'] as const)
      expect(AnalysisSchema.safeParse(makeAnalysis('test', scenario)).success).toBe(true)
  })
  it('拒绝非法赔率', () => {
    const result = makeAnalysis()
    result.odds[0]!.decimalOdds = 0
    expect(AnalysisSchema.safeParse(result).success).toBe(false)
  })
})
