import type { Market } from './model'
import { planningOperators } from '@/mocks/sports-planning'
export interface PlanningScope {
  category?: string
  operator?: string
  revision?: number
}
export function planningScopeError(scope: PlanningScope): string {
  if (!['all', 'crypto', 'sportsbooks', 'prediction'].includes(scope.category ?? 'all'))
    return '平台分类无效，请返回赔率页重新选择。'
  if (scope.operator && !planningOperators.some((row) => row.id === scope.operator))
    return '未找到所选报价平台，请返回赔率页重新选择。'
  if (scope.revision !== undefined && (!Number.isSafeInteger(scope.revision) || scope.revision < 0))
    return '报价快照版本无效，请返回赔率页重新选择。'
  return ''
}
/** The odds UI and AI share current quote records, filters and snapshot revision. */
export function scopedPlanningMarket(market: Market, scope: PlanningScope): Market {
  const operators = planningOperators.filter(
    (p) =>
      ((scope.category ?? 'all') === 'all' || p.category === scope.category) &&
      (!scope.operator || p.id === scope.operator),
  )
  return {
    ...market,
    quotes: planningScopeError(scope)
      ? []
      : market.quotes
          .filter((quote) => operators.some((p) => p.id === quote.operator))
          .map((quote, index) => {
            const clone = { ...quote, prices: [...quote.prices], before: [...quote.before] }
            if ((scope.revision ?? 0) % 2)
              clone.prices = clone.prices.map((value, outcome) =>
                value == null
                  ? null
                  : Number((value + ((index + outcome) % 2 ? 0.02 : -0.02)).toFixed(2)),
              )
            return clone
          }),
  }
}
