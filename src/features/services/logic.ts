import type { AgentPolicy } from './types'

export function estimateCommission(
  netRevenue: number,
  policy: Pick<AgentPolicy, 'commission' | 'venueFee'>,
  otherCosts = 0,
) {
  if (
    ![netRevenue, policy.commission, policy.venueFee, otherCosts].every(Number.isFinite) ||
    netRevenue < 0 ||
    netRevenue > 1e12 ||
    otherCosts < 0 ||
    otherCosts > 1e12 ||
    policy.commission < 0 ||
    policy.commission > 100 ||
    policy.venueFee < 0 ||
    policy.venueFee > 100
  )
    return null
  const base = Math.max(0, netRevenue * (1 - policy.venueFee / 100) - otherCosts)
  return Math.round(((base * policy.commission) / 100 + Number.EPSILON) * 100) / 100
}

export function formatUnits(value: number | null) {
  return value === null
    ? '暂无数据'
    : `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value)} U`
}
