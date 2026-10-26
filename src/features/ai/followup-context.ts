import type { ChatAnswer, ProjectScenario } from './conversation-types'
/** Only bounded analytical follow-ups reuse filters; commands and unrelated questions never inherit targets. */
export function monitorFollowup(
  text: string,
  previous?: ChatAnswer,
): { scenario: ProjectScenario; text: string } | undefined {
  const report = previous?.project
  if (
    !report?.query ||
    !['analytics', 'monitor', 'activity', 'efficiency', 'recommendation'].includes(report.scenario)
  )
    return
  const known = previous?.followups.includes(text.trim()) ?? false
  const short =
    /^(?:那平台\s*[a-z]|改看平台\s*[a-z]|(?:换成|改为)\s*\d+\s*(?:天|d|小时|h)|改按(?:资金活跃|盾牌分|存款额)|只看(?:TRON|TRC20|BSC|BEP20|ETH|ERC20|SOL|USDT|USDC|TRX|BNB)|(?:继续|具体)(?:解释|分析|说明)(?:这|刚才|该)|查看(?:这些|候选))/i.test(
      text,
    ) && text.length < 55
  if (!known && !short) return
  if (/关注|已读|邀请|工单|绑定|VIP|代理|比赛|赔率/.test(text)) return
  let scenario: ProjectScenario = report.scenario
  if (/资金表现|存款|出款额|净流量/.test(text)) scenario = 'analytics'
  else if (/推荐|候选|排在前面/.test(text)) scenario = 'recommendation'
  else if (/风险|核对/.test(text)) scenario = 'monitor'
  const q = report.query
  const pieces = [text]
  const inheritedIds =
    /候选/.test(text) && report.recommendations?.length
      ? report.recommendations.map((p) => p.platform)
      : q.platforms
  if (!/平台\s*[a-z]/i.test(text)) pieces.push(inheritedIds.map((id) => `平台 ${id}`).join('、'))
  if (!/\d+\s*(?:天|d|h|小时)/i.test(text)) pieces.push(q.period)
  if (!/TRON|TRC20|BSC|BEP20|ETH|ERC20|SOL|TON|Arbitrum|BTC/i.test(text))
    pieces.push(q.chains.join('/'))
  if (!/USDT|USDC|TRX|BNB|币种|代币/i.test(text))
    pieces.push(
      q.tokens.filter((t) => !['ETH', 'SOL'].includes(t)).join('/') +
        q.tokens
          .filter((t) => ['ETH', 'SOL'].includes(t))
          .map((t) => ` 币种${t}`)
          .join(''),
    )
  if (scenario === 'recommendation' && !/资金活跃|存款额|盾牌分/.test(text))
    pieces.push(report.recommendationGoal === 'deposits' ? '按资金活跃度推荐' : '按盾牌分推荐')
  return { scenario, text: pieces.filter(Boolean).join('；') }
}
