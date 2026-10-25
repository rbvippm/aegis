import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import QuoteMatrix from '@/features/sports/planning/QuoteMatrix.vue'
import FixtureCard from '@/features/sports/planning/FixtureCard.vue'
import PlanningTrend from '@/features/sports/planning/PlanningTrend.vue'
import { planningMatches } from '@/mocks/sports-planning'
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

describe('赔率变化短时提示', () => {
  it('初始无箭头，仅变化单元格提示，重复变化重新计时，三秒后移除', async () => {
    vi.useFakeTimers()
    const market = structuredClone(planningMatches[0]!.markets[0]!)
    const wrapper = mount(QuoteMatrix, { props: { market, format: 'HK' } })
    try {
      expect(wrapper.findAll('.sp-price-arrow')).toHaveLength(0)
      const updated = structuredClone(market)
      const quote = updated.quotes.find((q) => q.status === 'active' && q.prices[0] != null)!
      quote.prices[0] = quote.prices[0]! + 0.02
      await wrapper.setProps({ market: updated })
      expect(wrapper.findAll('.sp-price-arrow')).toHaveLength(1)
      expect(wrapper.find('.sp-change-up').exists()).toBe(true)
      await vi.advanceTimersByTimeAsync(2000)
      const repeated = structuredClone(updated)
      repeated.quotes.find((q) => q.operator === quote.operator)!.prices[0] =
        quote.prices[0]! - 0.04
      await wrapper.setProps({ market: repeated })
      expect(wrapper.find('.sp-change-down').exists()).toBe(true)
      await vi.advanceTimersByTimeAsync(2999)
      expect(wrapper.findAll('.sp-price-arrow')).toHaveLength(1)
      await vi.advanceTimersByTimeAsync(1)
      await nextTick()
      expect(wrapper.findAll('.sp-price-arrow')).toHaveLength(0)
      await wrapper.setProps({ format: 'DEC' })
      expect(wrapper.findAll('.sp-price-arrow')).toHaveLength(0)
    } finally {
      wrapper.unmount()
      vi.useRealTimers()
    }
  })
})

it('演示每十秒仅改变可见的少量报价，涨跌三秒后消失，离开释放计时器', async () => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 10,
    y: 100,
    top: 100,
    left: 10,
    bottom: 144,
    right: 100,
    width: 90,
    height: 44,
    toJSON() {},
  })
  const fixture = structuredClone(planningMatches[0]!)
  const wrapper = mount(FixtureCard, {
    props: { fixture, format: 'HK', followed: false, enabled: ['handicap', 'total', 'winner'] },
    global: { stubs: { GlassSelect: true } },
  })
  try {
    const before = wrapper.findAll('.sp-price strong').map((cell) => cell.text())
    await vi.advanceTimersByTimeAsync(9999)
    expect(wrapper.findAll('.sp-price-arrow')).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.findAll('.sp-price-arrow')).toHaveLength(2)
    expect(wrapper.findAll('.sp-change-up')).toHaveLength(1)
    expect(wrapper.findAll('.sp-change-down')).toHaveLength(1)
    const after = wrapper.findAll('.sp-price strong').map((cell) => cell.text())
    expect(after.filter((value, i) => value !== before[i])).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(3000)
    expect(wrapper.findAll('.sp-price-arrow')).toHaveLength(0)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await vi.advanceTimersByTimeAsync(7000)
    expect(wrapper.findAll('.sp-price strong').map((cell) => cell.text())).toEqual(after)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  } finally {
    if (wrapper.exists()) wrapper.unmount()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  }
})

it('走势按当前报价缩放，切换格式保留记录，锁盘不绘制有效曲线', async () => {
  const match = structuredClone(planningMatches[0]!)
  const market = match.markets[0]!
  const wrapper = mount(PlanningTrend, {
    props: { match, market, format: 'HK' },
    global: { stubs: { GlassSelect: true } },
  })
  try {
    const rows = wrapper.findAll('.sp-trend-table tbody tr').length
    expect(rows).toBeGreaterThan(1)
    const points = wrapper
      .get('polyline')
      .attributes('points')!
      .split(' ')
      .map((p) => p.split(',').map(Number))
    expect(points).toHaveLength(rows)
    expect(points.every(([x, y]) => x! >= 48 && x! <= 304 && y! >= 14 && y! <= 114)).toBe(true)
    const before = wrapper.find('.sp-trend-summary').text()
    await wrapper.setProps({ format: 'DEC' })
    expect(wrapper.find('.sp-trend-summary').text()).not.toBe(before)
    expect(wrapper.findAll('.sp-trend-table tbody tr')).toHaveLength(rows)
    const locked = structuredClone(market)
    locked.quotes.forEach((q) => {
      q.status = 'suspended'
    })
    await wrapper.setProps({ market: locked })
    expect(wrapper.find('polyline').exists()).toBe(false)
    expect(wrapper.find('.sp-notice').text()).toContain('锁盘')
  } finally {
    wrapper.unmount()
  }
})
