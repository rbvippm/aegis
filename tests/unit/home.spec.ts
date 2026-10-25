import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeBanner from '@/features/home/HomeBanner.vue'
import { walletSummary, findOpportunities } from '@/features/home/overview'
import { researchPlatforms } from '@/mocks/monitoring-research'
import { sportsMatches } from '@/mocks/sports'

describe('homepage summaries', () => {
  it('excludes unknown wallets rather than turning them into zero balances', () => {
    expect(walletSummary(researchPlatforms)).toEqual({ amount: '$67.4M', covered: 2 })
    expect(walletSummary([researchPlatforms[2]!])).toEqual({ amount: null, covered: 0 })
  })
  it('only surfaces complete eligible markets using active quotes', () => {
    const found = findOpportunities(sportsMatches)
    expect(found).toHaveLength(2)
    expect(found.every((item) => item.market.calculationEligible && item.result.gross > 0)).toBe(
      true,
    )
    const event = structuredClone(sportsMatches[0]!)
    event.markets.forEach((market) => market.quotes.forEach((quote) => (quote.status = 'stale')))
    expect(findOpportunities([event])).toEqual([])
  })
})

it('Banner自动平滑前进并在相同首尾页复位，不倒滑整条轨道', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390)
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')
  const scroll = vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
    this.scrollLeft = options.left ?? 0
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scroll })
  const wrapper = mount(HomeBanner)
  try {
    expect(wrapper.findAll('.home-banner__slide')).toHaveLength(6)
    expect(scroll).toHaveBeenLastCalledWith({ left: 390, behavior: 'instant' })
    await vi.advanceTimersByTimeAsync(5000)
    expect(scroll).toHaveBeenLastCalledWith({ left: 780, behavior: 'smooth' })
    const track = wrapper.get('.home-banner__track')
    await track.trigger('scroll')
    await vi.advanceTimersByTimeAsync(140)
    expect(wrapper.findAll('.home-banner__indicators button')[1]!.attributes('aria-current')).toBe(
      'true',
    )
    // Select the last real slide, then auto-advance into its identical first-slide neighbour.
    await wrapper.findAll('.home-banner__indicators button')[3]!.trigger('click')
    await track.trigger('scroll')
    await vi.advanceTimersByTimeAsync(5140)
    expect(scroll).toHaveBeenLastCalledWith({ left: 1950, behavior: 'smooth' })
    await track.trigger('scroll')
    await vi.advanceTimersByTimeAsync(140)
    expect(scroll).toHaveBeenLastCalledWith({ left: 390, behavior: 'instant' })
    expect(wrapper.findAll('.home-banner__indicators button')[0]!.attributes('aria-current')).toBe(
      'true',
    )
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  } finally {
    if (wrapper.exists()) wrapper.unmount()
    if (original) Object.defineProperty(HTMLElement.prototype, 'scrollTo', original)
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  }
})
