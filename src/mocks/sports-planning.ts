import { compareMatches } from './compare'
import { sportsPlatforms } from '@/features/sports/platforms'
import {
  sportsCatalog,
  type Fixture,
  type Market,
  type Operator,
  type Family,
  type Quote,
} from '@/features/sports/planning/model'
// Product-planning fixtures only; no provider requests or cross-platform matching engine.
export const planningOperators: Operator[] = [
  ...sportsPlatforms.map((p) => ({
    id: p.id,
    name: p.name,
    mark: p.mark,
    score: p.score,
    category: p.type === 'web3' ? ('prediction' as const) : ('sportsbooks' as const),
  })),
  ...[
    ['stake', 'Stake', 'S', 'crypto'],
    ['sportsbet', 'Sportsbet.io', 'SB', 'crypto'],
    ['cloudbet', 'Cloudbet', 'CB', 'crypto'],
    ['duel', 'Duel', 'D', 'crypto'],
    ['shuffle', 'Shuffle', 'Sh', 'crypto'],
    ['pinnacle', 'Pinnacle', 'Pi', 'sportsbooks'],
    ['bet365', 'Bet365', '365', 'sportsbooks'],
    ['kalshi', 'Kalshi', 'K', 'prediction'],
    ['novig', 'Novig', 'N', 'prediction'],
    ['prophetx', 'ProphetX', 'PX', 'prediction'],
    ['rebet', 'ReBet', 'R', 'prediction'],
    ['betopenly', 'BetOpenly', 'BO', 'prediction'],
  ].map(([id, name, mark, category]) => ({
    id: id!,
    name: name!,
    mark: mark!,
    category: category as Operator['category'],
    score: null,
  })),
]
export const planningDate = '2026-10-25'
export const planningSnapshot = '10/25 19:32 · UTC+8'
function quotes(count: number, seed: number): Quote[] {
  return planningOperators
    .filter((p) => p.id !== 'F')
    .map((p, i) => {
      let prices = Array.from({ length: count }, (_, j) =>
        Number((count * 0.97 + ((seed + i * 3 + j * 5) % 13) * 0.018).toFixed(2)),
      )
      if (count === 2)
        prices =
          i % 4 === 0
            ? [2.12, 1.83]
            : i % 4 === 1
              ? [1.86, 2.13]
              : [1.9 + (i % 3) * 0.02, 1.94 - (i % 2) * 0.02]
      if (count === 3) prices = [2.48 + (i % 4) * 0.08, 3.4 + (i % 3) * 0.11, 2.72 + (i % 5) * 0.07]
      if (count === 9)
        prices = prices.map((_, j) => Number((6.8 + j * 0.85 + (i % 4) * 0.12).toFixed(2)))
      const status = p.id === 'C' ? 'suspended' : p.id === 'E' ? 'stale' : 'active'
      return {
        operator: p.id,
        prices: status === 'suspended' ? prices.map(() => null) : prices,
        before: prices.map((v, j) => Number((v + ((i + j) % 2 ? 0.04 : -0.03)).toFixed(2))),
        status,
        matched: p.id !== 'polymarket' || seed % 3 !== 0,
      }
    })
}
function extraMarket(
  family: Family,
  id: string,
  label: string,
  selections: string[],
  seed: number,
  period = '全场',
  line = '标准盘',
  calculable = true,
): Market {
  return {
    id,
    family,
    label,
    period,
    line,
    scope: period === '上半场' ? '上半场 · 不含加时' : '全场 · 按该玩法结算',
    selections,
    quotes: quotes(selections.length, seed),
    calculable,
    rule:
      family === 'doubleChance'
        ? '双重机会的三个选项有重叠，只分别比较同一选项；不能直接作为互斥赛果对冲。'
        : family === 'drawNoBet'
          ? '平局时退还本金，主客胜结算；与胜平负盘分开比较。'
          : family === 'halfFull'
            ? '按半场和全场的胜平负组合结算，九项结果构成完整赛果。'
            : '同一赛事、玩法、时段、盘口线与结算范围下比较。',
  }
}
function enhance(base: Fixture, index: number): Fixture {
  const basketball = base.sport === 'basketball' || base.sport === 'ebasketball'
  const football = ['football', 'futsal', 'esoccer'].includes(base.sport)
  const markets: Market[] = []
  for (const source of base.markets) {
    markets.push(source)
    if (['handicap', 'total'].includes(source.family) && source.period === '全场') {
      const center =
        source.family === 'handicap' ? (basketball ? -3.5 : -0.5) : basketball ? 224.5 : 2.5
      for (const offset of [-1, 0.5, 1]) {
        const value = center + offset
        const m = structuredClone(source)
        m.id = `${source.id}-line-${value}`
        m.line =
          source.family === 'handicap'
            ? `主队 ${value > 0 ? '+' : ''}${value}`
            : `总${basketball ? '分' : '进球'} ${value}`
        m.selections =
          source.family === 'handicap'
            ? [`主 ${value > 0 ? '+' : ''}${value}`, `客 ${value < 0 ? '+' : ''}${-value}`]
            : [`大 ${value}`, `小 ${value}`]
        m.calculable = Math.abs(value % 1) === 0.5
        m.quotes = quotes(2, index + Math.round(value * 10))
        m.rule = m.calculable
          ? '半分 / 半球盘口，无走盘；覆盖主客或大小两项结果。'
          : '整数盘口包含走盘情形，仅展示比价，不套用无走盘的两项对冲公式。'
        markets.push(m)
      }
    }
  }
  if (football) {
    markets.unshift(extraMarket('winner', 'winner', '胜平负', ['主胜', '平局', '客胜'], index))
    markets.push(
      extraMarket('btts', 'btts', '双方进球', ['是', '否'], index + 2),
      extraMarket(
        'doubleChance',
        'double-chance',
        '双重机会',
        ['主胜或平', '主胜或客胜', '平或客胜'],
        index + 3,
        '全场',
        '双重机会',
        false,
      ),
      extraMarket(
        'drawNoBet',
        'draw-no-bet',
        '平局退款',
        ['主胜', '客胜'],
        index + 4,
        '全场',
        '平局退回',
        false,
      ),
      extraMarket(
        'halfFull',
        'half-full',
        '半全场',
        ['主/主', '主/平', '主/客', '平/主', '平/平', '平/客', '客/主', '客/平', '客/客'],
        index + 6,
      ),
    )
  }
  if (basketball) {
    markets.push(
      extraMarket('winner', 'winner-half', '半场胜负', ['主队胜', '客队胜'], index + 4, '上半场'),
      extraMarket(
        'handicap',
        'handicap-quarter',
        '单节让分',
        ['主 -1.5', '客 +1.5'],
        index + 2,
        '第1节',
        '主队 -1.5',
      ),
    )
  }
  markets.push(
    extraMarket('oddEven', 'odd-even', '单双', ['单', '双'], index + 7),
    extraMarket(
      'other',
      'team-total',
      '主队总分',
      ['大 1.5', '小 1.5'],
      index + 8,
      '全场',
      '主队总分 1.5',
    ),
  )
  return { ...base, markets }
}
const base: Fixture[] = compareMatches.map((m, i) => ({
  ...m,
  startsAt: `2026-10-${25 + (i % 3)}T${String(19 + (i % 4)).padStart(2, '0')}:30:00+08:00`,
  popular: i < 5,
  markets: m.markets.map((k) => ({
    id: k.id,
    family: k.kind,
    label: k.label,
    period: k.scope.includes('上半场') ? '上半场' : '全场',
    scope: k.scope,
    line: k.line,
    selections: [...k.selections],
    calculable: k.calculationEligible,
    rule: '只比较同赛事、同盘口线和同结算范围。',
    quotes: k.quotes.map((q) => ({
      operator: q.platform,
      prices: [q.home, q.away],
      before: [q.previousHome ?? q.home, q.previousAway ?? q.away],
      status: q.status,
      matched: q.settlementMatched !== false,
    })),
  })),
}))
for (let i = 0; i < base.length; i++) {
  const original = base[i]!
  for (const market of original.markets) {
    for (const q of quotes(2, i).filter(
      (q) => !market.quotes.some((x) => x.operator === q.operator),
    ))
      market.quotes.push(q)
  }
}
const pairs = [
  ['蓝鲸', '赤鹰'],
  ['星火', '北极'],
  ['银河', '海潮'],
  ['青松', '银杉'],
]
for (const [si, sport] of sportsCatalog.entries()) {
  for (let j = 0; j < 3; j++) {
    const pair = pairs[(si + j) % pairs.length]!
    const football = ['football', 'futsal', 'esoccer'].includes(sport.id)
    const home = `${pair[0]}${sport.esport ? '战队' : sport.id === 'tennis' ? '选手' : '队'}`,
      away = `${pair[1]}${sport.esport ? '战队' : sport.id === 'tennis' ? '选手' : '队'}`
    const index = si * 3 + j + base.length
    base.push({
      id: `planning-${sport.id}-${j}`,
      sport: sport.id,
      league: `${sport.esport ? '国际电竞' : j === 0 ? '亚洲' : j === 1 ? '欧洲' : '国际'}${sport.name}${sport.esport ? '大师赛' : '联赛'}`,
      home,
      away,
      phase: j === 0 ? 'live' : 'upcoming',
      stage:
        j === 0
          ? sport.esport
            ? '第2局 18:42'
            : football
              ? '下半场 68:20'
              : '第2阶段'
          : `10/${25 + j} ${20 + j}:00 · UTC+8`,
      score: j === 0 ? (football ? '1 : 1' : sport.esport ? '1 : 0' : '28 : 24') : 'VS',
      startsAt: `2026-10-${25 + j}T${20 + j}:00:00+08:00`,
      popular: j === 0,
      markets: [
        extraMarket(
          'winner',
          'winner',
          football ? '胜平负' : '胜负',
          football ? ['主胜', '平局', '客胜'] : ['主队胜', '客队胜'],
          index,
        ),
        extraMarket(
          'handicap',
          'handicap',
          '让球 / 让分',
          ['主 -1.5', '客 +1.5'],
          index + 1,
          '全场',
          '主队 -1.5',
        ),
        extraMarket(
          'total',
          'total',
          '大小球 / 大小分',
          ['大 2.5', '小 2.5'],
          index + 2,
          '全场',
          '总分 2.5',
        ),
      ].filter((m) => !(football && m.family === 'winner')),
    })
  }
}
export const planningMatches = base.map(enhance)
export function matchCenterData(f: Fixture) {
  const seed = planningMatches.findIndex((m) => m.id === f.id) + 1
  const basketball = ['basketball', 'ebasketball'].includes(f.sport)
  return {
    stats: basketball
      ? [
          ['场均得分', '112.8', '109.4'],
          ['场均失分', '106.2', '111.0'],
          ['投篮命中率', '48.6%', '46.9%'],
          ['三分命中率', '37.4%', '35.8%'],
          ['场均篮板', '44.2', '42.8'],
          ['场均助攻', '26.1', '24.6'],
        ]
      : f.sport === 'football'
        ? [
            ['场均进球', '1.8', '1.3'],
            ['场均失球', '0.9', '1.2'],
            ['控球率', '56%', '49%'],
            ['场均射门', '13.6', '10.8'],
            ['射正率', '42%', '38%'],
            ['零封场次', '4', '2'],
          ]
        : [
            ['近期胜率', '68%', '54%'],
            ['场均得分', '28.6', '25.2'],
            ['近十场胜场', '7', '5'],
            ['近十场负场', '3', '5'],
          ],
    form: [f.home, f.away].map((team, t) => ({
      team,
      results: Array.from({ length: 8 }, (_, i) => ({
        date: `10/${24 - i * 2}`,
        opponent: `${pairs[(seed + i + t) % 4]![0]}队`,
        venue: i % 2 ? '客场' : '主场',
        score: basketball ? `${108 + i} : ${101 + i + t}` : `${(i % 3) + 1} : ${t + (i % 2)}`,
        result: (i + t + seed) % 3 ? '胜' : '负',
      })),
    })),
    injuries: [f.home, f.away].map((team, t) => ({
      team,
      players: [
        {
          name: `${team} · 7号`,
          position: basketball ? '后卫' : '主力选手',
          reason: '踝部不适',
          status: '缺席',
          returnDate: '11/02',
        },
        {
          name: `${team} · 12号`,
          position: basketball ? '前锋' : '轮换选手',
          reason: '肌肉疲劳',
          status: t ? '出战成疑' : '每日观察',
          returnDate: '赛前评估',
        },
      ],
    })),
    standings: Array.from({ length: 8 }, (_, i) => ({
      name: i === 1 ? f.home : i === 4 ? f.away : `${pairs[i % 4]![0]}${i + 1}队`,
      played: 12,
      win: 10 - i,
      draw: f.sport === 'football' ? i % 3 : 0,
      loss: 2 + i - (f.sport === 'football' ? i % 3 : 0),
      points: (10 - i) * 3 + (f.sport === 'football' ? i % 3 : 0),
    })),
  }
}
