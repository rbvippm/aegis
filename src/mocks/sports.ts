import type { SportsMatch, SportsMarket } from '@/features/sports/types'

const quotes = [
  { platform: 'A', home: 1.9, away: 1.94, previousHome: 1.94, status: 'active' as const },
  { platform: 'B', home: 1.92, away: 1.96, status: 'active' as const },
  { platform: 'C', home: null, away: null, status: 'suspended' as const },
  { platform: 'D', home: 1.88, away: 1.93, status: 'active' as const },
  { platform: 'E', home: 1.93, away: 1.98, status: 'stale' as const },
]
function markets(sport: 'football' | 'basketball'): SportsMarket[] {
  const basketball = sport === 'basketball'
  return [
    {
      id: 'handicap',
      kind: 'handicap',
      label: basketball ? '让分' : '让球',
      scope: basketball ? '全场 · 含加时' : '全场 · 90分钟',
      line: basketball ? '主队 -3.5' : '主队 -0.5（半球）',
      selections: basketball ? ['主 -3.5', '客 +3.5'] : ['主 -0.5', '客 +0.5'],
      quotes,
      calculationEligible: basketball,
    },
    {
      id: 'total',
      kind: 'total',
      label: basketball ? '大小分' : '大小球',
      scope: basketball ? '全场 · 含加时' : '全场 · 90分钟',
      line: basketball ? '总分 224.5' : '总进球 2.5',
      selections: basketball ? ['大 224.5', '小 224.5'] : ['大 2.5', '小 2.5'],
      quotes: quotes.map((q) => ({ ...q, previousHome: undefined })),
      calculationEligible: true,
    },
    {
      id: 'winner',
      kind: 'winner',
      label: '胜负',
      scope: basketball ? '全场 · 含加时' : '全场 · 平局另列',
      line: '两项结果',
      selections: ['主队胜', '客队胜'],
      quotes: [
        { platform: 'A', home: 2.1, away: 1.8, status: 'active' },
        { platform: 'B', home: 1.82, away: 2.1, status: 'active' },
        { platform: 'C', home: null, away: null, status: 'suspended' },
      ],
      calculationEligible: basketball,
    },
  ].filter((m) => basketball || m.id !== 'winner') as SportsMarket[]
}
export const sportsMatches: SportsMatch[] = [
  {
    id: 'north-south',
    sport: 'basketball',
    league: '篮球联赛',
    home: '北辰队',
    away: '南岳队',
    phase: 'live',
    stage: '第4节 06:12',
    score: '98 : 95',
    markets: markets('basketball'),
  },
  {
    id: 'harbor-mountain',
    sport: 'football',
    league: '亚洲联赛',
    home: '海港队',
    away: '山城队',
    phase: 'live',
    stage: '下半场 63:24',
    score: '1 : 0',
    markets: markets('football'),
  },
  {
    id: 'east-west',
    sport: 'basketball',
    league: '篮球联赛',
    home: '东岚队',
    away: '西岭队',
    phase: 'upcoming',
    stage: '10月24日 20:30 · UTC+8',
    score: 'VS',
    markets: markets('basketball'),
  },
]
// Equal coverage across all ranked operators. Figures are local fixtures, not real operator claims.
export const sportsRankings = [
  { id: 'A', hold: 2.8, edge: 1.9, share: 31, samples: 128, status: 'active' },
  { id: 'B', hold: 3.1, edge: 2.1, share: 27, samples: 128, status: 'active' },
  { id: 'C', hold: 3.45, edge: 2.4, share: 22, samples: 128, status: 'active' },
  { id: 'D', hold: 3.9, edge: 2.7, share: 15, samples: 128, status: 'active' },
  { id: 'E', hold: null, edge: null, share: null, samples: 8, status: 'partial' },
  { id: 'F', hold: null, edge: null, share: null, samples: 128, status: 'stale' },
]
export const sportsMovements = [
  {
    id: 'price-a',
    matchId: 'north-south',
    type: '水位',
    description: '平台 A 主队 0.94 → 0.90',
    detail: '同一让分 · 主队 -3.5',
    time: '19:32:05',
  },
  {
    id: 'line-a',
    matchId: 'north-south',
    type: '盘口',
    description: '平台 A 主让 -2.5 → -3.5',
    detail: '第4节 · 98 : 95',
    time: '19:31:48',
  },
  {
    id: 'suspended-c',
    matchId: 'north-south',
    type: '暂停',
    description: '平台 C · 等待恢复报价',
    detail: '暂停报价不参与最优价计算',
    time: '19:31:12',
  },
]
