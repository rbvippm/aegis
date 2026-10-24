import type { AnswerKind, ChatAnswer, ChatSource } from '@/features/ai/conversation-types'

// These are layout fixtures, independent of live sports, platform identity or risk services.
export const aiSuggestions = [
  { text: '今晚维拉 vs 曼城，怎么看？', kind: 'sports' },
  { text: '同盘口，哪家平台报价更好？', kind: 'odds' },
  { text: 'TRON 小额出金，优先看哪家？', kind: 'funding' },
] as const
export const aiScope = {
  fixture: '阿斯顿维拉 vs 曼城',
  fixtureId: 'illustrative-villa-city',
  kickoff: '英超 · 19:30 · UTC+8',
  market: '主队 +0.75 · 全场90分钟 · 港盘',
  funding: 'TRON · USDT · <1,000 · 近7天',
  window: '10/17—10/23 · UTC+8',
}
export const aiOffers = [
  { platform: 'A', price: '0.94', status: '有效', eligible: true },
  { platform: 'B', price: '0.91', status: '有效', eligible: true },
  { platform: 'C', price: '0.96', status: '报价过期', eligible: false },
]
export const aiFunding = [
  { platform: 'A', median: '3m24s', samples: 126, eligible: true },
  { platform: 'B', median: '5m08s', samples: 64, eligible: true },
  { platform: 'C', median: '样本不足', samples: 8, eligible: false },
]
const sources: ChatSource[] = [
  {
    id: 'rules',
    title: '盘口结算规则 v2',
    type: '内部知识库',
    excerpt:
      '四分之一盘口拆为相邻两档，分别结算。主队 +0.75 拆为 +0.5 与 +1.0；负一球输半，打平或获胜全赢。',
    asOf: '规则版本 v2',
    status: '仅展示可访问摘录',
  },
  {
    id: 'sports',
    title: '赛事与盘口资料',
    type: '赛事资料',
    excerpt: '赛事时间、伤停、首发与报价以当时记录为准。',
    asOf: '赛事与报价时间待核验',
    status: '待核验',
  },
  {
    id: 'funding',
    title: '平台出金样本口径',
    type: '内部统计',
    excerpt:
      'TRON、USDT、小额 <1,000、近7天；从平台申请到到账的中位耗时。样本不足不参与排序，出金速度不等于安全评级。',
    asOf: aiScope.window,
    status: '申请到到账记录',
  },
]
export function mockChatAnswer(kind: AnswerKind): ChatAnswer {
  if (kind === 'sports')
    return {
      kind,
      summary: '先确认首发，再看受让方向的容错。',
      sources: sources.slice(0, 2),
      followups: ['为什么选受让？', '比较其他平台'],
    }
  if (kind === 'funding')
    return {
      kind,
      summary: '相同口径下比较到账表现，再单独核对风险。',
      sources: [sources[2]!],
      followups: ['大额出金呢？', '查看平台 B'],
    }
  return {
    kind,
    summary:
      '当前固定资料尚不能回答任意实时问题。请补充赛事名称、市场与盘口，或要比较的平台出入金。',
    sources: [],
    followups: [aiSuggestions[0].text, aiSuggestions[2].text],
  }
}
