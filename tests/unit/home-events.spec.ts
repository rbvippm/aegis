import { describe, it, expect } from 'vitest'
import { sportsMatches } from '@/mocks/sports'
import { homeMovements } from '@/mocks/home-movements'
import { recommendedQuotes, movementTone, movementValue } from '@/features/home/events'
describe('首页赛事推荐与动态口径', () => {
  it('按每个同盘口选项独立推荐，排除过期和暂停报价', () => {
    const event = structuredClone(sportsMatches[0]!)
    const market = event.markets.find((item) => item.kind === 'winner')!
    const result = recommendedQuotes(market)
    expect(result.map((item) => [item.side, item.quote.platform, item.decimal])).toEqual([
      ['home', 'A', 2.1],
      ['away', 'B', 2.1],
    ])
    market.quotes.push({ platform: 'E', status: 'stale', home: 9, away: 9 })
    market.quotes.push({ platform: 'F', status: 'active', home: null, away: null })
    expect(recommendedQuotes(market).map((item) => item.decimal)).toEqual([2.1, 2.1])
    market.quotes[0]!.status = 'suspended'
    expect(recommendedQuotes(market).find((item) => item.side === 'home')?.quote.platform).toBe('B')
    market.quotes.forEach((item) => (item.status = 'stale'))
    expect(recommendedQuotes(market)).toEqual([])
  })
  it('所有制式从十进制转换，涨跌方向不随负数制式改变', () => {
    const move = homeMovements[0]!
    expect(movementValue(move, 'HK')).toBe('0.94 → 0.90')
    expect(movementValue(move, 'DEC')).toBe('1.94 → 1.90')
    expect(movementValue(move, 'ID')).toBe('−1.06 → −1.11')
    expect(movementTone(move)).toBe('down')
    expect(movementTone({ ...move, before: 1.9, after: 1.94 })).toBe('up')
  })
  it('最近20条记录有明确平台、赛事和玩法，时间倒序且不使用当前时钟', () => {
    expect(homeMovements).toHaveLength(20)
    expect(new Set(homeMovements.map((item) => item.id)).size).toBe(20)
    for (const [index, item] of homeMovements.entries()) {
      const event = sportsMatches.find((match) => match.id === item.matchId)
      expect(event?.markets.some((market) => market.id === item.marketId)).toBe(true)
      if (index) expect(item.time <= homeMovements[index - 1]!.time).toBe(true)
    }
  })
})
