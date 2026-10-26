import { describe, expect, it } from 'vitest'
import { planningAnswer, planningSuggestions } from '@/mocks/ai-planning'
import { planningMatches, planningOperators } from '@/mocks/sports-planning'
import { scopedPlanningMarket } from '@/features/sports/planning/ai-scope'
import { bestQuote } from '@/features/sports/planning/model'
import { formatOdds } from '@/features/sports/logic'
const base = { fixture: 'harbor-mountain', market: 'handicap', selection: 0 }
describe('体育规划 AI 入口', () => {
  it('按当前全平台市场和方向比较报价，推荐价等于赔率页的有效最优价', () => {
    const fixture = planningMatches.find((f) => f.id === base.fixture)!
    const market = fixture.markets.find((m) => m.id === base.market)!
    for (const selection of [0, 1]) {
      const answer = planningAnswer({ ...base, selection })
      const best = bestQuote(market, selection)!
      expect(answer.project?.sports).toMatchObject({ ...base, selection, source: 'sports' })
      expect(answer.project?.scope).toContain(market.selections[selection])
      expect(answer.summary).toContain(formatOdds(best.prices[selection]!, 'DEC'))
      const excluded = answer.project?.table?.rows.filter((row) => !/^第 \d+ 名$/.test(row[2]!))
      expect(excluded?.length).toBeGreaterThan(0)
      expect(answer.project?.actions[0]?.to).toContain('market=handicap')
      expect(answer.summary).toContain('不代表比赛胜率')
    }
  })
  it('错误赛事、错误市场、方向越界、未知平台和异常版本都不套用默认记录', () => {
    for (const input of [
      { ...base, fixture: 'unknown' },
      { ...base, market: 'unknown' },
      { ...base, selection: 8 },
      { ...base, selection: -1 },
      { ...base, selection: NaN },
      { ...base, operator: 'not-a-platform' },
      { ...base, revision: Infinity },
      { ...base, category: 'region' },
    ]) {
      const answer = planningAnswer(input)
      expect(answer.kind).toBe('clarify')
      expect(answer.project).toBeUndefined()
      expect(answer.sources).toHaveLength(0)
    }
  })
  it('类别、平台及刷新版本复用同一范围，报价状态来自记录', () => {
    const fixture = planningMatches.find((f) => f.id === base.fixture)!
    const original = fixture.markets.find((m) => m.id === base.market)!
    for (const scope of [
      { category: 'crypto', revision: 1 },
      { category: 'all', operator: 'A', revision: 1 },
      { category: 'crypto', revision: 0 },
    ]) {
      const market = scopedPlanningMarket(original, scope)
      expect(
        market.quotes.every(
          (q) => q.status === original.quotes.find((r) => r.operator === q.operator)?.status,
        ),
      ).toBe(true)
      const selection = 1
      const answer = planningAnswer({ ...base, selection, ...scope })
      const best = bestQuote(market, selection)
      expect(answer.project?.sports).toMatchObject(scope)
      const target = new URL(answer.project!.actions[0]!.to, 'https://aegis.example')
      expect(target.searchParams.get('category')).toBe(scope.category)
      expect(target.searchParams.get('operator')).toBe('operator' in scope ? scope.operator : '')
      expect(target.searchParams.has('scenario')).toBe(false)
      expect(target.searchParams.get('revision')).toBe(String(scope.revision))
      expect(target.searchParams.get('selection')).toBe(String(selection))
      if (best) expect(answer.summary).toContain(formatOdds(best.prices[selection]!, 'DEC'))
      for (const row of answer.project?.table?.rows ?? []) {
        expect(
          market.quotes.some(
            (q) => planningOperators.find((p) => p.id === q.operator)?.name === row[0],
          ),
        ).toBe(true)
      }
    }
    expect(original.quotes.some((q) => q.prices.some((p) => p !== null))).toBe(true)
  })
  it('无有效报价不伪造较优平台，三项结果不压缩为主客两项', () => {
    expect(planningAnswer({ ...base, category: 'crypto', operator: 'A' }).summary).toContain(
      '没有可参与比较的有效报价',
    )
    const fixture = planningMatches.find((f) => f.markets.some((m) => m.selections.length === 3))!
    const market = fixture.markets.find((m) => m.selections.length === 3)!
    const answer = planningAnswer({ fixture: fixture.id, market: market.id, selection: 2 })
    expect(answer.project?.scope).toContain(market.selections[2])
    expect(answer.project?.details[0]?.text).toContain('3 个结果')
    expect(answer.project?.sports?.selection).toBe(2)
  })
  it('欢迎页示例使用可解析的实际规划赛事和市场', () => {
    expect(planningSuggestions).toHaveLength(2)
    for (const suggestion of planningSuggestions)
      expect(planningAnswer(suggestion.entry).kind).toBe('project')
  })
})
