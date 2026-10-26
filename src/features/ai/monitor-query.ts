import {
  analyticsChains,
  analyticsTokens,
  analyticsPeriods,
  type AnalyticsQuery,
} from '@/features/monitoring/analytics-model'
/** Parse only the filters supported by the current monitoring page; never broaden an unsupported filter. */
export function readMonitorQuery(
  text: string,
  fallbackPlatforms: string[],
): { query: AnalyticsQuery; issue?: string } {
  const ids = [...text.matchAll(/平台\s*([a-z])(?:\b|(?=[\u4e00-\u9fff]))/gi)].map((m) =>
    m[1]!.toUpperCase(),
  )
  const time = text.match(/(?:近|最近)?\s*(\d+)\s*(天|d|小时|h)/i)
  const period = time ? `${Number(time[1])}${/小时|h/i.test(time[2]!) ? 'h' : 'd'}` : '30d'
  const chainText = text.replace(
    /(?:币种|资产|代币)\s*(ETH|SOL)|(ETH|SOL)\s*(?:币种|资产|代币|币)/gi,
    '',
  )
  const chains = analyticsChains.filter((c) =>
    new RegExp(`\\b${c}\\b|${c}(?=[链上\\u4e00-\\u9fff])`, 'i').test(chainText),
  )
  for (const [alias, chain] of [
    ['TRC20', 'TRON'],
    ['BEP20', 'BSC'],
    ['ERC20', 'ETH'],
  ] as const)
    if (new RegExp(alias, 'i').test(text) && !chains.includes(chain)) chains.push(chain)
  const tokens = analyticsTokens.filter((t) =>
    ['ETH', 'SOL'].includes(t)
      ? new RegExp(`(?:币种|资产|代币)\\s*${t}|${t}\\s*(?:币种|资产|代币|币)`, 'i').test(text)
      : new RegExp(t, 'i').test(text),
  )
  const query: AnalyticsQuery = {
    period: analyticsPeriods.includes(period as AnalyticsQuery['period'])
      ? (period as AnalyticsQuery['period'])
      : '30d',
    platforms: [...new Set(ids.length ? ids : fallbackPlatforms)],
    chains: chains.length ? chains : [...analyticsChains],
    tokens: tokens.length ? tokens : [...analyticsTokens],
  }
  const unsupportedChain = text.match(
    /Arbitrum|TON|Polygon|BTC|Bitcoin|比特币|波卡|Avalanche/i,
  )?.[0]
  const unsupportedToken = text.match(/DAI|USDD|TUSD|狗狗币|DOGE|XRP|FDUSD/i)?.[0]
  if (unsupportedChain)
    return {
      query,
      issue: `当前台账不覆盖 ${unsupportedChain}，不能用全部公链数据替代。可选择 TRON、BSC、ETH 或 SOL。`,
    }
  if (unsupportedToken)
    return { query, issue: `当前台账不覆盖 ${unsupportedToken}，请先选择有记录的币种。` }
  if (time && !analyticsPeriods.includes(period as AnalyticsQuery['period']))
    return {
      query,
      issue: `当前可比较窗口为 24h、7d、30d、90d、365d，不能把 ${time[0]} 的请求替换成其他窗口。`,
    }
  return { query }
}
export function monitorTarget(query: AnalyticsQuery, platform?: string) {
  const params = new URLSearchParams({
    period: query.period,
    chains: query.chains.join(','),
    tokens: query.tokens.join(','),
    platforms: (platform ? [platform] : query.platforms).join(','),
  })
  if (platform) params.set('platform', platform)
  return `/monitor?${params}`
}
export function monitorScope(query: AnalyticsQuery) {
  return `${query.period} · ${query.platforms.length ? query.platforms.map((id) => `平台 ${id}`).join(' / ') : '未选平台'} · ${query.chains.join('/')} · ${query.tokens.length === analyticsTokens.length ? '全部币种' : query.tokens.join('/')} · USD`
}
