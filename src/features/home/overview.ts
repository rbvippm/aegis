import { allocateBudget, bestPrice } from '@/features/sports/logic'
import type { SportsMatch } from '@/features/sports/types'
import type { ResearchPlatform } from '@/features/monitoring/research'

export function findOpportunities(matches: SportsMatch[]) {
  return matches.flatMap((match) =>
    match.markets
      .filter((market) => market.calculationEligible)
      .flatMap((market) => {
        const home = bestPrice(market, 'home')
        const away = bestPrice(market, 'away')
        const result = home && away ? allocateBudget(1000, [home, away]) : null
        return result && result.gross > 0 ? [{ match, market, result }] : []
      }),
  )
}
export function walletSummary(platforms: ResearchPlatform[]) {
  // Source balances are formatted USD snapshots. Missing or unknown units stay excluded.
  const amounts = platforms
    .flatMap((p) => {
      const value = p.wallet?.match(/^\$([\d.]+)([MB])$/)
      return value ? [Number(value[1]) * (value[2] === 'B' ? 1000 : 1)] : []
    })
    .filter(Number.isFinite)
  return {
    amount: amounts.length ? `$${amounts.reduce((a, b) => a + b, 0).toFixed(1)}M` : null,
    covered: amounts.length,
  }
}
