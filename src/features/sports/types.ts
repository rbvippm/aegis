export type OddsFormat = 'HK' | 'MY' | 'ID' | 'DEC'
export type Sport = 'football' | 'basketball' | 'tennis'
export type MarketKind = 'handicap' | 'total' | 'winner'
export interface SportsQuote {
  platform: string
  home: number | null
  away: number | null
  previousHome?: number
  previousAway?: number
  settlementMatched?: boolean
  maxStake?: number
  feeRate?: number
  status: 'active' | 'suspended' | 'stale'
}
export interface SportsMarket {
  id: string
  kind: MarketKind
  label: string
  scope: string
  line: string
  selections: [string, string]
  quotes: SportsQuote[]
  // Only complete two-outcome markets without push/partial settlement use the simple calculator.
  calculationEligible: boolean
}
export interface SportsMatch {
  id: string
  sport: Sport
  league: string
  home: string
  away: string
  phase: 'live' | 'upcoming'
  stage: string
  score: string
  markets: SportsMarket[]
}
export interface SlipLeg {
  eventId: string | null
  eventName: string
  sport: string
  platform: string
  selection: string
  decimal: number
  result: 'home' | 'away' | null
  marketId: string | null
}
export interface AlertSetting {
  matchId: string
  marketId?: string
  platform: string
  type: 'price' | 'line' | 'status'
  target: number | null
  windowSeconds: number
  cooldownMinutes: number
  merge: boolean
  selection: string
}
