import { describe, expect, it } from 'vitest'
import {
  allocateBudget,
  bestPrice,
  formatOdds,
  toDecimal,
  validateSlip,
} from '@/features/sports/logic'
import { sportsMatches } from '@/mocks/sports'
import type { SlipLeg } from '@/features/sports/types'

describe('体育报价与分配', () => {
  it('赔率格式等价，负号不改变比较基础', () => {
    expect(formatOdds(1.9, 'HK')).toBe('0.90')
    expect(formatOdds(1.9, 'MY')).toBe('+0.90')
    expect(formatOdds(1.9, 'ID')).toBe('−1.11')
    expect(formatOdds(2.5, 'MY')).toBe('−0.67')
    expect(formatOdds(2, 'MY')).toBe('+1.00')
    expect(toDecimal(-0.5, 'MY')).toBe(3)
    expect(toDecimal(-2, 'ID')).toBe(1.5)
    expect(toDecimal(1.5, 'MY')).toBeNull()
    expect(toDecimal(0, 'HK')).toBeNull()
  })
  it('最优价排除暂停与过期报价', () => {
    expect(bestPrice(sportsMatches[0]!.markets[0]!, 'away')).toBe(1.96)
  })
  it('以实际分币结果重算最小毛收益，不输出未计费用的净收益', () => {
    const result = allocateBudget(1000, [2.1, 2.1])!
    expect(result.stakes).toEqual([500, 500])
    expect(result.returns).toEqual([1050, 1050])
    expect(result.gross).toBe(50)
    expect(result.roi).toBe(5)
    const rounded = allocateBudget(17.31, [2.215, 1.896])!
    expect(rounded.stakes.reduce((a, b) => a + b, 0)).toBeCloseTo(17.31, 2)
    expect(rounded.gross).toBeCloseTo(Math.min(...rounded.returns) - 17.31)
    expect(allocateBudget(Infinity, [2, 2])).toBeNull()
    expect(allocateBudget(100, [0, 2])).toBeNull()
    expect(allocateBudget(0.001, [2, 2])).toBeNull()
  })
})
const base: SlipLeg = {
  eventId: 'north-south',
  eventName: '北辰队 VS 南岳队',
  sport: '篮球',
  platform: '平台 A',
  selection: '北辰队胜',
  decimal: 2.1,
  result: 'home',
  marketId: 'winner',
}
describe('注单校验', () => {
  it('不同赛事不能套用套利公式', () => {
    expect(validateSlip([base, { ...base, eventId: 'other', result: 'away' }]).valid).toBe(false)
  })
  it('拒绝缺失、重复或不同结算市场，完整两项才放行', () => {
    expect(validateSlip([base, base]).valid).toBe(false)
    expect(validateSlip([base, { ...base, result: 'away', marketId: 'handicap' }]).valid).toBe(
      false,
    )
    expect(validateSlip([base, { ...base, result: 'away', marketId: null }]).valid).toBe(false)
    expect(validateSlip([base, { ...base, result: 'away' }]).valid).toBe(true)
  })
})
