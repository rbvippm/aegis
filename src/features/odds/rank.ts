import type { Market, OddsQuote } from '@/shared/contracts/analysis'
export function sameMarket(a: Market, b: Market): boolean {
  return (
    a.fixtureId === b.fixtureId &&
    a.market === b.market &&
    a.selection === b.selection &&
    a.line === b.line &&
    a.period === b.period &&
    a.phase === b.phase &&
    a.settlementRuleId === b.settlementRuleId
  )
}
export function rankOdds(quotes: OddsQuote[], market: Market) {
  const valid = quotes
    .filter((q) => q.eligible && q.freshness === 'fresh' && sameMarket(q.market, market))
    .sort((a, b) => b.decimalOdds - a.decimalOdds)
  return valid.map((quote, index) => ({
    ...quote,
    rank: valid.findIndex((q) => q.decimalOdds === valid[index]!.decimalOdds) + 1,
  }))
}
