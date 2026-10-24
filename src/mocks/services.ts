import type { AgentPolicy, VipOffer } from '@/features/services/types'

// Fictional, fixed examples. These are never used when VITE_DATA_MODE=api.
export const serviceSnapshot = '2026-10-24 · UTC+8'
export const vipOffers: VipOffer[] = [
  {
    id: 'A',
    name: '平台 A',
    level: 6,
    lossback: 8,
    cashback: 0.8,
    period: '月',
    cap: 2000,
    rollover: '返现需完成 1 倍流水；排除对冲与无效投注',
  },
  {
    id: 'B',
    name: '平台 B',
    level: 5,
    lossback: 10,
    cashback: 0.6,
    period: '周',
    cap: 1000,
    rollover: '返现需完成 3 倍流水；部分场馆与玩法不计入',
  },
]
export const agentPolicies: AgentPolicy[] = [
  {
    id: 'A',
    name: '平台 A',
    commission: 40,
    venueFee: 8,
    settlement: 'weekly',
    carryover: false,
    deductions: '支付手续费',
    lockTerms: '演示：争议订单对应佣金可冻结 7 日，需提供订单凭证与书面原因；其余佣金按期结算。',
  },
  {
    id: 'B',
    name: '平台 B',
    commission: 45,
    venueFee: 12,
    settlement: 'daily',
    carryover: true,
    deductions: '活动费 + 手续费',
    lockTerms: '演示：活动成本先行扣减；异常流量争议可暂停当期佣金结算，复核周期需另行书面约定。',
  },
]
export const anonymousRankings = {
  '30': [
    { alias: '鲸鱼 #7K2', volume: '10–20万 U', quotes: 3 },
    { alias: '鲸鱼 #9M4', volume: '5–10万 U', quotes: 2 },
  ],
  '90': [
    { alias: '鲸鱼 #9M4', volume: '20–50万 U', quotes: 4 },
    { alias: '鲸鱼 #7K2', volume: '20–50万 U', quotes: 3 },
  ],
}
