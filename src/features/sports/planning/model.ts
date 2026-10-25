export type Family =
  | 'winner'
  | 'handicap'
  | 'total'
  | 'btts'
  | 'doubleChance'
  | 'drawNoBet'
  | 'oddEven'
  | 'halfFull'
  | 'other'
export type Category = 'all' | 'crypto' | 'sportsbooks' | 'prediction'
export type Metric = 'typical' | 'sharp' | 'moneyline' | 'share'
export interface Operator {
  id: string
  name: string
  mark: string
  category: Exclude<Category, 'all'>
  score: number | null
}
export interface Quote {
  operator: string
  prices: (number | null)[]
  before: (number | null)[]
  status: 'active' | 'suspended' | 'stale'
  matched: boolean
}
export interface Market {
  id: string
  family: Family
  label: string
  period: string
  scope: string
  line: string
  selections: string[]
  quotes: Quote[]
  calculable: boolean
  rule: string
}
export interface Fixture {
  id: string
  sport: string
  league: string
  home: string
  away: string
  phase: 'live' | 'upcoming'
  stage: string
  score: string
  startsAt: string
  popular: boolean
  markets: Market[]
}
export const familyNames: Record<Family, string> = {
  winner: '胜负',
  handicap: '让球 / 让分',
  total: '大小球 / 大小分',
  btts: '双方进球',
  doubleChance: '双重机会',
  drawNoBet: '平局退款',
  oddEven: '单双',
  halfFull: '半全场',
  other: '其他玩法',
}
export const categoryNames: Record<Category, string> = {
  all: '全部平台',
  crypto: '加密体育',
  sportsbooks: '传统体育',
  prediction: '预测市场',
}
export const metricNames: Record<Metric, string> = {
  typical: '典型抽水',
  sharp: '最优赔率',
  moneyline: '胜负盘抽水',
  share: '最优占比',
}
export const sportsCatalog = [
  ['football', '足球'],
  ['basketball', '篮球'],
  ['tennis', '网球'],
  ['american-football', '美式足球'],
  ['ice-hockey', '冰球'],
  ['boxing', '拳击'],
  ['cricket', '板球'],
  ['mma', '综合格斗'],
  ['cs', 'CS'],
  ['dota', 'Dota 2'],
  ['lol', '英雄联盟'],
  ['valorant', '无畏契约'],
  ['baseball', '棒球'],
  ['table-tennis', '乒乓球'],
  ['volleyball', '排球'],
  ['handball', '手球'],
  ['ebasketball', '电子篮球'],
  ['kabaddi', '卡巴迪'],
  ['floorball', '地板球'],
  ['futsal', '五人制足球'],
  ['field-hockey', '曲棍球'],
  ['rugby', '橄榄球'],
  ['badminton', '羽毛球'],
  ['squash', '壁球'],
  ['darts', '飞镖'],
  ['esoccer', '电子足球'],
  ['aussie-rules', '澳式足球'],
  ['bandy', '班迪球'],
  ['snooker', '斯诺克'],
  ['netball', '篮网球'],
  ['golf', '高尔夫'],
  ['kog', '王者荣耀'],
  ['pesapallo', '芬式棒球'],
  ['aov', '传说对决'],
].map(([id, name]) => ({
  id: id!,
  name: name!,
  esport: ['cs', 'dota', 'lol', 'valorant', 'ebasketball', 'esoccer', 'kog', 'aov'].includes(id!),
}))
export const sportName = (id: string) => sportsCatalog.find((s) => s.id === id)?.name ?? id
export const valid = (q: Quote) => q.status === 'active' && q.matched
export const number = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export function bestQuote(market: Market, index: number) {
  return market.quotes
    .filter((q) => valid(q) && q.prices[index] != null && q.prices[index]! > 1)
    .sort((a, b) => b.prices[index]! - a.prices[index]!)[0]
}
export function analysis(market: Market) {
  if (!market.calculable) return null
  const best = market.selections.map((_, i) => bestQuote(market, i))
  if (best.some((q) => !q)) return null
  const sum = best.reduce((s, q, i) => s + 1 / q!.prices[i]!, 0)
  return { best: best as Quote[], sum, percentage: sum * 100, roi: (1 / sum - 1) * 100 }
}
export function percentile(values: number[], p: number) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const i = (sorted.length - 1) * p
  const lo = Math.floor(i)
  return sorted[lo]! + (sorted[Math.ceil(i)]! - sorted[lo]!) * (i - lo)
}
export function rankOperators(fixtures: Fixture[], operators: Operator[], metric: Metric) {
  return operators
    .flatMap((operator) => {
      const lines = fixtures.flatMap((f) =>
        f.markets
          .filter((m) => m.calculable && (metric !== 'moneyline' || m.family === 'winner'))
          .flatMap((m) => {
            const q = m.quotes.find((q) => q.operator === operator.id && valid(q))
            return q &&
              q.prices.length === m.selections.length &&
              q.prices.every((p) => p != null && p > 1)
              ? [
                  {
                    fixture: f,
                    market: m,
                    prices: q.prices as number[],
                    margin: (q.prices.reduce<number>((s, p) => s + 1 / p!, 0) - 1) * 100,
                  },
                ]
              : []
          }),
      )
      const outcomes = lines.reduce((sum, line) => sum + line.prices.length, 0)
      const wins = lines.reduce(
        (sum, line) =>
          sum +
          line.prices.filter((price, i) => price === bestQuote(line.market, i)?.prices[i]).length,
        0,
      )
      const value =
        metric === 'share'
          ? outcomes
            ? (wins / outcomes) * 100
            : null
          : percentile(
              lines.map((l) => l.margin),
              metric === 'sharp' ? 0.1 : 0.5,
            )
      return value == null
        ? []
        : [{ operator, value, lines, games: new Set(lines.map((l) => l.fixture.id)).size }]
    })
    .sort((a, b) => (metric === 'share' ? b.value - a.value : a.value - b.value))
}
export function normalized(value: string) {
  return value.toLowerCase().replace(/[\s,，.。:：\-_]/g, '')
}
export function matchSlip(text: string, fixtures: Fixture[]) {
  return text
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((text) => {
      const clean = normalized(text.split('@')[0]!.replace(/(?:主队|客队)?胜$/, ''))
      const matches = fixtures.filter((f) =>
        [f.home, f.away, `${f.home}vs${f.away}`, `${f.home}v${f.away}`, f.league].some(
          (n) => clean.includes(normalized(n)) || normalized(n).includes(clean),
        ),
      )
      return { text, matches, selected: matches.length === 1 ? matches[0]!.id : '' }
    })
}
