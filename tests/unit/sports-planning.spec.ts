import { describe, it, expect } from 'vitest'
import {
  analysis,
  bestQuote,
  percentile,
  rankOperators,
  matchSlip,
  sportsCatalog,
} from '@/features/sports/planning/model'
import { planningMatches, planningOperators } from '@/mocks/sports-planning'

describe('体育规划数据与多赛果计算', () => {
  it('覆盖目录、日期、平台类别与完整的三项和九项赛果', () => {
    expect(sportsCatalog).toHaveLength(34)
    expect(new Set(planningMatches.map((f) => f.id)).size).toBe(planningMatches.length)
    expect(new Set(planningOperators.map((p) => p.category)).size).toBe(3)
    expect(new Set(planningMatches.map((f) => f.startsAt.slice(0, 10))).size).toBeGreaterThan(1)
    const f = planningMatches.find((f) => f.sport === 'football')!
    expect(f.markets.find((m) => m.family === 'winner')!.selections).toHaveLength(3)
    expect(f.markets.find((m) => m.family === 'halfFull')!.selections).toHaveLength(9)
    for (const m of f.markets)
      for (const q of m.quotes) expect(q.prices).toHaveLength(m.selections.length)
  })
  it('不将锁盘、缺失或独立规则价格纳入最优结果，不给重叠赛果虚构收益', () => {
    const base = planningMatches
      .find((f) => f.sport === 'football')!
      .markets.find((m) => m.family === 'winner')!
    const m = {
      ...base,
      quotes: [
        {
          operator: 'A',
          prices: [3.3, 3.3, 3.3],
          before: [],
          status: 'active' as const,
          matched: true,
        },
        {
          operator: 'B',
          prices: [99, 99, 99],
          before: [],
          status: 'suspended' as const,
          matched: true,
        },
        {
          operator: 'C',
          prices: [99, 99, 99],
          before: [],
          status: 'active' as const,
          matched: false,
        },
      ],
    }
    expect(bestQuote(m, 1)?.operator).toBe('A')
    expect(analysis(m)?.percentage).toBeCloseTo(100 / 1.1)
    expect(analysis(m)?.roi).toBeCloseTo(10)
    expect(analysis({ ...m, calculable: false })).toBeNull()
    expect(
      analysis({ ...m, quotes: m.quotes.map((q) => ({ ...q, prices: [3.3, null, 3.3] })) }),
    ).toBeNull()
  })
  it('排名汇总与逐盘口原始价格一致，胜负范围独立', () => {
    const fixtures = planningMatches.filter((f) => f.sport === 'football')
    for (const metric of ['typical', 'sharp', 'moneyline'] as const) {
      const rows = rankOperators(fixtures, planningOperators, metric)
      expect(rows.length).toBeGreaterThan(10)
      expect(rows.map((r) => r.value)).toEqual(rows.map((r) => r.value).sort((a, b) => a - b))
      const row = rows[0]!
      const margins = row.lines.map((l) => (l.prices.reduce((s, p) => s + 1 / p, 0) - 1) * 100)
      expect(row.value).toBeCloseTo(percentile(margins, metric === 'sharp' ? 0.1 : 0.5)!)
      if (metric === 'moneyline')
        expect(row.lines.every((l) => l.market.family === 'winner')).toBe(true)
    }
  })
  it('最优占比按完整结果计数，按占比降序展示', () => {
    const fixtures = planningMatches.filter((f) => f.sport === 'football')
    const rows = rankOperators(fixtures, planningOperators, 'share')
    expect(rows.map((r) => r.value)).toEqual(rows.map((r) => r.value).sort((a, b) => b - a))
    expect(rows.every((r) => r.value >= 0 && r.value <= 100)).toBe(true)
    const row = rows[0]!
    const hits = row.lines.reduce(
      (sum, l) => sum + l.prices.filter((p, i) => p === bestQuote(l.market, i)?.prices[i]).length,
      0,
    )
    const total = row.lines.reduce((sum, l) => sum + l.prices.length, 0)
    expect(row.value).toBeCloseTo((hits / total) * 100)
  })
  it('多行注单可匹配不同赛事，模糊联赛不擅自选择', () => {
    const result = matchSlip('海港队\n北辰队\n东岚队\n不存在的球队', planningMatches)
    expect(new Set(result.slice(0, 3).map((r) => r.selected)).size).toBe(3)
    expect(result.slice(0, 3).every((r) => r.selected)).toBe(true)
    expect(result[3]!.selected).toBe('')
    const league = planningMatches[0]!.league
    const ambiguous = matchSlip(league, planningMatches)[0]!
    if (ambiguous.matches.length > 1) expect(ambiguous.selected).toBe('')
  })
})
