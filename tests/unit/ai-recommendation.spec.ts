import { afterEach, expect, it, vi } from 'vitest'
import { mockProjectAnswer } from '@/mocks/ai-project'
import { monitoringPlatforms } from '@/mocks/monitoring-platforms'
import { analyticsAsOf, analyticsLedger } from '@/mocks/monitoring-analytics'
import { day, money } from '@/features/monitoring/analytics-model'
import { readMonitorQuery } from '@/features/ai/monitor-query'
import { monitorFollowup } from '@/features/ai/followup-context'
import { requestChat } from '@/features/ai/conversation-service'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('评分候选遵循现有平台评分且缺失评分明确排除，来源时间分开展示', () => {
  const answer = mockProjectAnswer('recommendation', '按盾牌分推荐值得优先了解的平台')
  const expected = monitoringPlatforms
    .filter((platform) => platform.score !== null)
    .sort((a, b) => b.score! - a.score!)
    .slice(0, 3)
    .map((platform) => platform.id)
  expect(answer.project?.recommendations?.map((item) => item.platform)).toEqual(expected)
  expect(expected).toEqual(['A', 'J', 'F'])
  expect(answer.project?.details.find((section) => section.title === '未参与排序')?.text).toContain(
    '平台 C：评分样本不足',
  )
  expect(answer.sources).toHaveLength(2)
  expect(answer.sources[0]?.asOf).not.toBe(answer.sources[1]?.asOf)
  expect(answer.project?.caveat).toContain('不是资金安全保证')
})

it('资金活跃候选按同链同币种同窗口实际存款额排序，跳转保留所有条件', () => {
  const answer = mockProjectAnswer(
    'recommendation',
    '按资金活跃度推荐平台 A、平台 B、平台 J，近7天 TRON USDT',
  )
  const deposits = ['A', 'B', 'J'].map((id) => ({
    id,
    amount: analyticsLedger
      .filter(
        (row) =>
          row.platform === id &&
          row.chain === 'TRON' &&
          row.token === 'USDT' &&
          row.direction === 'deposit' &&
          row.time >= analyticsAsOf - 7 * day &&
          row.time < analyticsAsOf,
      )
      .reduce((sum, row) => sum + row.usd, 0),
  }))
  deposits.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id))
  expect(answer.project?.recommendationGoal).toBe('deposits')
  expect(answer.project?.recommendations?.map((item) => item.platform)).toEqual(
    deposits.map((item) => item.id),
  )
  expect(answer.summary).toContain('不代表更安全')
  for (const candidate of answer.project!.recommendations!) {
    expect(candidate.facts.find((fact) => fact.label === '7d 存款')?.value).toBe(
      money(deposits.find((item) => item.id === candidate.platform)!.amount),
    )
    const target = new URL(candidate.to, 'https://aegis.test')
    expect(target.searchParams.get('platform')).toBe(candidate.platform)
    expect(target.searchParams.get('platforms')).toBe(candidate.platform)
    expect(target.searchParams.get('period')).toBe('7d')
    expect(target.searchParams.get('chains')).toBe('TRON')
    expect(target.searchParams.get('tokens')).toBe('USDT')
  }
  const comparison = new URL(answer.project!.actions[0]!.to, 'https://aegis.test')
  expect(comparison.searchParams.get('compare')?.split(',')).toEqual(
    deposits.map((item) => item.id),
  )
  expect(comparison.searchParams.get('platforms')).toBe('A,B,J')
})

it.each([
  ['推荐平台 Z', '没有平台 Z'],
  ['推荐平台 A，TON链近7天', '不覆盖 TON'],
  ['推荐平台 A，TRON DAI近7天', '不覆盖 DAI'],
  ['推荐平台 A，近14天', '不能把'],
])('不支持的范围不能悄悄替换后给出候选：%s', (question, issue) => {
  const answer = mockProjectAnswer('recommendation', question)
  expect(answer.summary).toContain(issue)
  expect(answer.project?.recommendations).toBeUndefined()
  expect(answer.project?.actions).toEqual([{ label: '打开平台监测重新选择', to: '/monitor' }])
})

it.each(['F', 'J'])('平台 %s 的监测回答不套用 A/B/C，参数与金额来自自身范围', (id) => {
  const platform = monitoringPlatforms.find((item) => item.id === id)!
  const answer = mockProjectAnswer(
    'monitor',
    `解读平台 ${id} 的盾牌分、热钱包与出金评级，近7天 TRON USDT`,
  )
  expect(answer.project?.query?.platforms).toEqual([id])
  expect(answer.summary).toContain(`${platform.name}盾牌分 ${platform.score}/10`)
  expect(answer.summary).toContain(`小额平均出款 ${platform.smallMinutes} 分钟`)
  expect(answer.project?.table?.rows.map((row) => row[0])).toEqual([platform.name])
  expect(answer.project?.actions).toHaveLength(1)
  expect(answer.summary).not.toContain('平台 A')
  expect(answer.summary).not.toContain('平台 B')
})

it('只看关注且没有关注时不自动推荐排名前三的平台', () => {
  const answer = mockProjectAnswer('recommendation', '从我关注的平台中按盾牌分推荐', {
    follows: [],
    platformUnread: 0,
  })
  expect(answer.project?.query?.platforms).toEqual([])
  expect(answer.project?.recommendations).toEqual([])
  expect(answer.summary).toContain('当前没有符合范围的平台')
})

it('明确币种 ETH 不会误改为 ETH 链，链别名与完整范围解析一致', () => {
  expect(readMonitorQuery('平台 A 近7天 TRC20 USDT', []).query).toEqual({
    period: '7d',
    chains: ['TRON'],
    tokens: ['USDT'],
    platforms: ['A'],
  })
  const native = readMonitorQuery('平台 A 近7天 TRON 币种ETH', []).query
  expect(native.chains).toEqual(['TRON'])
  expect(native.tokens).toEqual(['ETH'])
})

it('限定追问换平台或周期时保留其余范围，办事及新话题不继承目标', async () => {
  vi.useFakeTimers()
  const previous = mockProjectAnswer('analytics', '平台 A 近30天 TRON USDT 资金表现')
  expect(monitorFollowup('帮我关注平台 B', previous)).toBeUndefined()
  expect(monitorFollowup('比较 VIP 条款', previous)).toBeUndefined()
  const changedPlatform = requestChat(
    '那平台 B 呢？',
    previous,
    new AbortController().signal,
    () => {},
  )
  await vi.runAllTimersAsync()
  const next = await changedPlatform
  expect(next.project?.query).toEqual({
    period: '30d',
    platforms: ['B'],
    chains: ['TRON'],
    tokens: ['USDT'],
  })
  const changedPeriod = requestChat('换成7天', next, new AbortController().signal, () => {})
  await vi.runAllTimersAsync()
  expect((await changedPeriod).project?.query).toEqual({
    period: '7d',
    platforms: ['B'],
    chains: ['TRON'],
    tokens: ['USDT'],
  })
  const command = requestChat('帮我关注平台 F', next, new AbortController().signal, () => {})
  await vi.runAllTimersAsync()
  expect((await command).project?.commands?.map((item) => item.platform)).toEqual(['F'])
})

it('API 模式拒绝固定推荐回复，不静默回退 demo', async () => {
  vi.stubEnv('VITE_DATA_MODE', 'api')
  vi.resetModules()
  const service = await import('@/features/ai/conversation-service')
  await expect(
    service.requestChat('按盾牌分推荐平台', undefined, new AbortController().signal, () => {}),
  ).rejects.toThrow('暂时无法生成回答')
})

it('未分链实测不能按速度直接推荐，不相关追问不继承监测范围', () => {
  const speed = mockProjectAnswer('recommendation', '推荐出金最快的平台')
  expect(speed.project?.recommendations).toBeUndefined()
  expect(speed.summary).toContain('同链、同币种')
  const previous = mockProjectAnswer('analytics', '平台 F 近7天 TRON USDT 存款')
  expect(monitorFollowup('为什么维拉今天会赢？', previous)).toBeUndefined()
})
