import type { OddsFormat, SlipLeg, SportsMarket, SportsQuote } from './types'

export function formatOdds(decimal: number | null, format: OddsFormat): string {
  if (decimal === null || !Number.isFinite(decimal) || decimal <= 1) return '—'
  const hk = decimal - 1
  if (format === 'DEC') return decimal.toFixed(2)
  if (format === 'HK') return hk.toFixed(2)
  const value = format === 'MY' ? (decimal <= 2 ? hk : -1 / hk) : decimal >= 2 ? hk : -1 / hk
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`
}
export function toDecimal(value: number, format: OddsFormat): number | null {
  if (!Number.isFinite(value)) return null
  if (format === 'DEC') return value > 1 ? value : null
  if (format === 'HK') return value > 0 ? value + 1 : null
  if (
    !value ||
    (format === 'MY' && Math.abs(value) > 1) ||
    (format === 'ID' && Math.abs(value) < 1)
  )
    return null
  return value > 0 ? 1 + value : 1 - 1 / value
}
export const isValidQuote = (quote: SportsQuote) => quote.status === 'active'
export function bestPrice(market: SportsMarket, side: 'home' | 'away') {
  const quotes = market.quotes
    .filter(isValidQuote)
    .filter((quote) => quote[side] !== null && Number.isFinite(quote[side]) && quote[side]! > 1)
  return quotes.reduce<number | null>((best, quote) => Math.max(best ?? 0, quote[side]!), null)
}
export function allocateBudget(budget: number, decimals: number[]) {
  if (
    !Number.isFinite(budget) ||
    budget <= 0 ||
    budget > 1e9 ||
    decimals.length < 2 ||
    decimals.some((d) => !Number.isFinite(d) || d <= 1)
  )
    return null
  const sum = decimals.reduce((total, d) => total + 1 / d, 0)
  const cents = Math.round(budget * 100)
  if (cents < decimals.length) return null
  const allocations = decimals.map((d) => Math.floor(cents / d / sum))
  let remainder = cents - allocations.reduce((a, b) => a + b, 0)
  for (let i = 0; remainder > 0; i++, remainder--) allocations[i % allocations.length]!++
  const stakes = allocations.map((value) => value / 100)
  const returns = stakes.map((stake, index) => Math.floor(stake * decimals[index]! * 100) / 100)
  const gross = Math.min(...returns) - cents / 100
  return { stakes, returns, gross, roi: (gross / (cents / 100)) * 100, sum }
}
export function validateSlip(legs: SlipLeg[]) {
  if (legs.length < 2) return { valid: false, reason: '至少需要两条已识别的结果。' }
  if (legs.some((leg) => !leg.eventId || !leg.result))
    return { valid: false, reason: '部分记录尚未匹配赛事、市场或选项，请修改后重新识别。' }
  if (new Set(legs.map((leg) => leg.eventId)).size !== 1)
    return { valid: false, reason: '两条记录属于不同赛事，且未覆盖同一市场的完整赛果。' }
  if (legs.some((leg) => !leg.marketId) || new Set(legs.map((leg) => leg.marketId)).size !== 1)
    return { valid: false, reason: '市场、时段或结算规则不一致，不能组成对冲方案。' }
  if (legs.length !== 2 || new Set(legs.map((leg) => leg.result)).size !== 2)
    return { valid: false, reason: '结果重复或缺少对手选项，不能组成对冲方案。' }
  return { valid: true, reason: '已匹配同一赛事、市场与两项完整结果；报价及费用仍需核验。' }
}
