// Editable product proposal. These plans do not grant entitlements or debit AI points.
export type SubscriptionLevel = 'L1' | 'L2' | 'L3'
export interface SubscriptionPlan {
  id: SubscriptionLevel
  name: string
  description: string
  monthlyPoints: number
  alert: string
  quote: string
  support: string
}
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'L1',
    name: '轻享',
    description: '关注赛事，轻松开启分析',
    monthlyPoints: 1000,
    alert: '关注赛事提醒',
    quote: 'VIP 转移报价咨询',
    support: '标准工单跟进',
  },
  {
    id: 'L2',
    name: '进阶',
    description: '多平台比较，让选择更从容',
    monthlyPoints: 5000,
    alert: '多赛事条件提醒与归并',
    quote: 'VIP 转移优先报价',
    support: '工单优先跟进',
  },
  {
    id: 'L3',
    name: '尊享',
    description: '专属需求，深度定制支持',
    monthlyPoints: 15000,
    alert: '多赛事、多玩法组合提醒',
    quote: 'VIP 转移优先报价与定制方案',
    support: '复杂工单专属跟进',
  },
]
export const subscriptionReset = '每月 1 日 00:00（UTC+8）'
export const subscriptionBenefits = [
  {
    id: 'alerts',
    title: '赛事提醒',
    description: '比分与开赛关注、赔率阈值、盘口变化，重要信息集中到消息中心。',
    values: subscriptionPlans.map((p) => p.alert),
    to: '/compare?panel=reminders',
    action: '管理赛事提醒',
  },
  {
    id: 'ai',
    title: 'AI 分析积分',
    description: '赛事分析、赔率解读与内部资料辅助分析，共用同一积分账户。',
    values: subscriptionPlans.map((p) => `${p.monthlyPoints.toLocaleString('en-US')} 积分 / 月`),
    to: '/ai',
    action: '前往 AI 分析',
  },
  {
    id: 'vip',
    title: 'VIP 转移与报价',
    description: '匿名核验现有待遇，比较不同平台的等级匹配、返水、Lossback 与完整条款。',
    values: subscriptionPlans.map((p) => p.quote),
    to: '/me?section=vip',
    action: '获取定制报价',
  },
  {
    id: 'odds',
    title: '赔率对比与对冲',
    description: '同场同盘比较、完整比价与预算分配，结合成本查看理论收益。',
    values: ['同盘口赔率比较', '跨平台完整比价与对冲试算', '多赛事比较与对冲方案分析'],
    to: '/compare',
    action: '查看赔率对比',
  },
  {
    id: 'monitor',
    title: '平台监测与来源',
    description: '链上资金、出金观察及来源追溯，了解数据的时间与覆盖范围。',
    values: ['平台监测与来源查看', '多平台对比与风险筛选', '跨平台资金与风险深度解读'],
    to: '/monitor',
    action: '查看平台监测',
  },
  {
    id: 'uid',
    title: 'UID 与收益记录',
    description: '集中管理平台绑定、返水资格和结算记录。',
    values: ['平台 UID 绑定与收益记录', '多平台待遇与结算跟进', '定制报价与收益条件协同核对'],
    to: '/me?section=earnings',
    action: '管理 UID 与收益',
  },
  {
    id: 'support',
    title: '工单与服务',
    description: '保留私密材料与处理记录，按需求跟进平台问题。',
    values: subscriptionPlans.map((p) => p.support),
    to: '/me?section=tickets',
    action: '查看我的工单',
  },
  {
    id: 'agents',
    title: '团队与代理支持',
    description: '按团队规模、结算周期与扣减条款比较合作条件。',
    values: ['查看代理政策', '团队合作条件比较', '团队代理定制方案'],
    to: '/me?section=agents',
    action: '查看代理服务',
  },
] as const
export function getSubscriptionPlan(value: unknown) {
  return subscriptionPlans.find((p) => p.id === value)
}
