import { formatOdds, bestPrice } from '@/features/sports/logic'
import type { OddsFormat, SportsMarket } from '@/features/sports/types'
export interface HomeMovement {
  id: string
  matchId: string
  marketId: string
  platform: string
  type: 'price' | 'line' | 'suspended'
  side: 'home' | 'away'
  before?: number
  after?: number
  beforeLine?: string
  afterLine?: string
  time: string
}
export const sportName = (sport: string) =>
  ({ football: '足球', basketball: '篮球', tennis: '网球' })[sport] ?? sport
export function recommendedQuotes(market: SportsMarket) {
  return (['home', 'away'] as const).flatMap((side) => {
    const best = bestPrice(market, side)
    if (best === null) return []
    const winners = market.quotes.filter(
      (quote) => quote.status === 'active' && quote[side] === best,
    )
    return [
      {
        side,
        selection: market.selections[side === 'home' ? 0 : 1],
        decimal: best,
        quote: winners[0]!,
        ties: winners.length,
      },
    ]
  })
}
export function movementTone(move: HomeMovement) {
  return move.type === 'price' && move.before !== undefined && move.after !== undefined
    ? move.after > move.before
      ? 'up'
      : move.after < move.before
        ? 'down'
        : 'flat'
    : move.type === 'price'
      ? 'flat'
      : move.type
}
export function movementLabel(move: HomeMovement) {
  return move.type === 'price'
    ? movementTone(move) === 'up'
      ? '赔率上升'
      : movementTone(move) === 'down'
        ? '赔率下降'
        : '赔率持平'
    : move.type === 'line'
      ? '盘口变化'
      : '暂停报价'
}
export function movementValue(move: HomeMovement, format: OddsFormat) {
  return move.type === 'price'
    ? `${formatOdds(move.before ?? null, format)} → ${formatOdds(move.after ?? null, format)}`
    : move.type === 'line'
      ? `${move.beforeLine} → ${move.afterLine}`
      : '等待恢复报价'
}
