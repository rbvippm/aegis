import type { SportsMatch, SportsMarket } from '@/features/sports/types'
import { sportsMatches } from './sports'
// Fixed local fixtures. Named Web3 venues are layout examples, not actual venue quotes or integrations.
function enriched(match: SportsMatch, index: number): SportsMatch {
  const full = structuredClone(match)
  full.markets = full.markets.flatMap((market, mi) => {
    const q = market.quotes.map((quote, qi) => ({
      ...quote,
      previousHome:
        quote.home === null ? undefined : Number((quote.home + (qi % 2 ? -0.03 : 0.04)).toFixed(2)),
      previousAway:
        quote.away === null ? undefined : Number((quote.away + (qi % 2 ? 0.02 : -0.04)).toFixed(2)),
    }))
    const marketQuotes = [
      ...q,
      {
        platform: 'azuro',
        home: market.kind === 'winner' ? 2.12 : 1.95,
        away: market.kind === 'winner' ? 1.85 : 1.91,
        previousHome: 1.92,
        previousAway: 1.94,
        status: 'active' as const,
        settlementMatched: true,
        maxStake: 1500,
        feeRate: 0.01,
      },
      {
        platform: 'overtime',
        home: market.kind === 'winner' ? 1.87 : 1.9,
        away: market.kind === 'winner' ? 2.13 : 1.98,
        previousHome: 1.93,
        previousAway: 1.95,
        status: 'active' as const,
        settlementMatched: true,
        maxStake: 1200,
        feeRate: 0.015,
      },
      {
        platform: 'polymarket',
        home: 2.2,
        away: 1.85,
        previousHome: 2.16,
        previousAway: 1.88,
        status: 'active' as const,
        settlementMatched: false,
        maxStake: 800,
        feeRate: 0.02,
      },
    ]
    const base: SportsMarket = { ...market, quotes: marketQuotes }
    if (market.kind === 'winner') return [base]
    const basketball = match.sport === 'basketball'
    const line = market.kind === 'handicap' ? (basketball ? -1.5 : -1.5) : basketball ? 112.5 : 1.5
    const variant: SportsMarket = {
      ...base,
      id: `${market.id}-half`,
      scope: basketball ? '上半场 · 不含加时' : '上半场 · 45分钟',
      line: market.kind === 'handicap' ? `主队 ${line}` : `总${basketball ? '分' : '进球'} ${line}`,
      selections:
        market.kind === 'handicap'
          ? [`主 ${line}`, `客 +${Math.abs(line)}`]
          : [`大 ${line}`, `小 ${line}`],
      quotes: marketQuotes.map((quote, qi) => ({
        ...quote,
        home:
          quote.home === null
            ? null
            : Number((1.83 + qi * 0.018 + index * 0.002 + mi * 0.01).toFixed(2)),
        away: quote.away === null ? null : Number((1.97 - qi * 0.012).toFixed(2)),
      })),
      calculationEligible: market.kind === 'total' || basketball,
    }
    return [base, variant]
  })
  return full
}
const extra: SportsMatch[] = [
  {
    id: 'river-forest',
    sport: 'basketball',
    league: '亚洲篮球联赛',
    home: '江城队',
    away: '林海队',
    phase: 'live',
    stage: '第3节 08:45',
    score: '66 : 62',
    markets: sportsMatches[0]!.markets,
  },
  {
    id: 'city-bay',
    sport: 'basketball',
    league: '欧洲篮球联赛',
    home: '城北队',
    away: '湾区队',
    phase: 'live',
    stage: '第2节 03:18',
    score: '38 : 41',
    markets: sportsMatches[0]!.markets,
  },
  {
    id: 'star-light',
    sport: 'basketball',
    league: '欧洲篮球联赛',
    home: '星河队',
    away: '曙光队',
    phase: 'upcoming',
    stage: '10/25 21:00 · UTC+8',
    score: 'VS',
    markets: sportsMatches[0]!.markets,
  },
  {
    id: 'peak-valley',
    sport: 'basketball',
    league: '亚洲篮球联赛',
    home: '高峰队',
    away: '溪谷队',
    phase: 'upcoming',
    stage: '10/25 21:30 · UTC+8',
    score: 'VS',
    markets: sportsMatches[0]!.markets,
  },
  {
    id: 'south-port',
    sport: 'football',
    league: '欧洲足球联赛',
    home: '南城队',
    away: '港湾队',
    phase: 'live',
    stage: '上半场 32:18',
    score: '0 : 1',
    markets: sportsMatches[1]!.markets,
  },
  {
    id: 'blue-red',
    sport: 'football',
    league: '欧洲足球联赛',
    home: '蓝星队',
    away: '红杉队',
    phase: 'upcoming',
    stage: '10/25 22:00 · UTC+8',
    score: 'VS',
    markets: sportsMatches[1]!.markets,
  },
  {
    id: 'island-hill',
    sport: 'football',
    league: '亚洲联赛',
    home: '海岛队',
    away: '山丘队',
    phase: 'live',
    stage: '下半场 72:40',
    score: '2 : 2',
    markets: sportsMatches[1]!.markets,
  },
  {
    id: 'tennis-one',
    sport: 'tennis',
    league: '国际网球巡回赛',
    home: '林泽',
    away: '周远',
    phase: 'live',
    stage: '第2盘',
    score: '1 : 0',
    markets: [{ ...sportsMatches[0]!.markets[2]!, scope: '全场 · 退赛规则一致' }],
  },
  {
    id: 'tennis-two',
    sport: 'tennis',
    league: '国际网球巡回赛',
    home: '陈越',
    away: '许川',
    phase: 'upcoming',
    stage: '10/25 20:00 · UTC+8',
    score: 'VS',
    markets: [{ ...sportsMatches[0]!.markets[2]!, scope: '全场 · 退赛规则一致' }],
  },
]
export const compareMatches = [...sportsMatches, ...extra].map(enriched)
export const quoteHistory = [
  { time: '19:32:05', home: 1.9, away: 1.94 },
  { time: '19:30:18', home: 1.94, away: 1.9 },
  { time: '19:27:42', home: 1.92, away: 1.92 },
  { time: '19:24:10', home: 1.96, away: 1.88 },
  { time: '19:20:33', home: 1.91, away: 1.94 },
  { time: '19:16:08', home: 1.89, away: 1.96 },
  { time: '19:10:22', home: 1.93, away: 1.91 },
  { time: '19:02:00', home: 1.88, away: 1.98 },
]
