import { describe, it, expect } from 'vitest'
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
