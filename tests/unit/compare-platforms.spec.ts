import { describe, it, expect } from 'vitest'
import { compareMatches } from '@/mocks/compare'
import { sportsMatches } from '@/mocks/sports'
import { bestPrice, allocateBudget, isValidQuote } from '@/features/sports/logic'
import { getSportsPlatform } from '@/features/sports/platforms'
describe('跨平台盘口与对冲数据', () => {
  it('独立扩充赛事和子玩法，不修改首页原始报价', () => {
    expect(compareMatches.length).toBeGreaterThan(10)
    expect(new Set(compareMatches.map((m) => m.id)).size).toBe(compareMatches.length)
    expect(compareMatches.filter((m) => m.sport === 'tennis')).toHaveLength(2)
    expect(sportsMatches).toHaveLength(3)
    expect(sportsMatches[0]!.markets).toHaveLength(3)
    const markets = compareMatches[0]!.markets
    expect(new Set(markets.map((m) => m.id)).size).toBe(markets.length)
    expect(markets.find((m) => m.id === 'handicap-half')?.scope).toContain('上半场')
  })
  it('不兼容的预测合约即使赔率更高也不参与最优赔率或对冲计算', () => {
    const market = compareMatches[0]!.markets.find((m) => m.id === 'winner')!
    const unmatched = market.quotes.find((q) => q.platform === 'polymarket')!
    expect(unmatched.home).toBeGreaterThan(bestPrice(market, 'home')!)
    expect(isValidQuote(unmatched)).toBe(false)
    expect(bestPrice(market, 'home')).toBe(2.12)
    expect(bestPrice(market, 'away')).toBe(2.13)
    const result = allocateBudget(1000, [bestPrice(market, 'home')!, bestPrice(market, 'away')!])!
    expect(result.stakes.reduce((a, b) => a + b, 0)).toBe(1000)
    expect(result.gross).toBeGreaterThan(60)
  })
  it('平台评分和赔率高低独立，未评估的 Web3 平台不给虚构分数', () => {
    expect(getSportsPlatform('A')?.score).toBe(9.2)
    expect(getSportsPlatform('azuro')?.score).toBeNull()
    expect(compareMatches[0]!.markets[0]!.quotes.some((q) => q.previousHome! > q.home!)).toBe(true)
    expect(compareMatches[0]!.markets[0]!.quotes.some((q) => q.previousAway! < q.away!)).toBe(true)
  })
})
