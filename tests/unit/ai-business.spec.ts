import { afterEach, expect, it, vi } from 'vitest'
import { mockProjectAnswer, resolveProjectScenario } from '@/mocks/ai-project'
import { aiCapabilityPrompts } from '@/mocks/ai-capabilities'
import { analyticsAsOf, analyticsLedger, analyticsOpening } from '@/mocks/monitoring-analytics'
import {
  analyticsChains,
  analyticsTokens,
  firstActivity,
  selectTransfers,
  summarize,
  walletBalances,
  day,
  money,
} from '@/features/monitoring/analytics-model'
import { requestChat } from '@/features/ai/conversation-service'
afterEach(() => vi.useRealTimers())
it('所有展示场景可解析为包含依据与可执行入口的回答', () => {
  for (const prompt of aiCapabilityPrompts) {
    const scenario = resolveProjectScenario(prompt.text)
    expect(scenario, prompt.text).toBeDefined()
    const a = mockProjectAnswer(scenario!, prompt.text, { follows: ['B'], platformUnread: 2 })
    expect(a.project?.reasons.length).toBeGreaterThan(0)
    expect((a.project?.actions.length ?? 0) + (a.project?.commands?.length ?? 0)).toBeGreaterThan(0)
  }
})
it('资金报告与监测同函数、同窗口且余额不丢失，内部转账不计出入金', () => {
  const q = {
    period: '30d' as const,
    chains: analyticsChains,
    tokens: analyticsTokens,
    platforms: ['A'],
  }
  const stats = summarize(
    selectTransfers(analyticsLedger, q, analyticsAsOf),
    firstActivity(analyticsLedger),
    analyticsAsOf - 30 * day,
  )
  const balance = walletBalances(analyticsLedger, analyticsOpening, q, analyticsAsOf).reduce(
    (sum, r) => sum + r.usd,
    0,
  )
  const r = mockProjectAnswer('analytics', '平台 A 近30天资金表现').project!
  expect(r.table?.rows).toEqual([
    [
      '平台 A',
      `${money(stats.deposits)} / ${money(stats.withdrawals)}`,
      `${money(stats.net)} / ${money(balance)}`,
    ],
  ])
  expect(stats.deposits).toBeGreaterThan(0)
  expect(balance).toBeGreaterThan(0)
})
it('关注状态改变分析范围，读消息与关注只返回待执行命令', () => {
  expect(
    mockProjectAnswer('activity', '我关注的异常动态', { follows: ['B'], platformUnread: 2 }).project
      ?.scope,
  ).toContain('平台 B')
  const report = mockProjectAnswer('following', '帮我关注平台 A', {
    follows: ['B'],
    platformUnread: 2,
  }).project!
  expect(report.commands).toEqual([{ label: '关注平台 A', kind: 'follow', platform: 'A' }])
  expect(report.takeaway).toContain('2 条')
  expect(report.takeaway).toContain('点击后执行')
  expect(mockProjectAnswer('following', '取消关注平台 A').project?.commands?.[0]?.kind).toBe(
    'unfollow',
  )
  expect(
    mockProjectAnswer('following', '帮我把平台异常消息标为已读').project?.commands?.[0]?.kind,
  ).toBe('read-platform')
})
it('未知平台不套用其他数据或生成关注命令；邀请不输出共享码或伪造注册', () => {
  const unknown = mockProjectAnswer('following', '关注平台 Z').project!
  expect(unknown.commands).toBeUndefined()
  expect(unknown.takeaway).toContain('没有平台 Z')
  const invite = mockProjectAnswer('invitation', '帮我邀请好友').project!
  expect(invite.actions[0]?.to).toBe('/me?panel=invite')
  expect(invite.takeaway).toContain('独立邀请码')
  expect(JSON.stringify(invite)).not.toContain('aegis1688')
})
it('跨场景追问不把上个范围附加到关注命令', async () => {
  vi.useFakeTimers()
  const previous = mockProjectAnswer('activity', '查看我关注平台的近7天异常动态')
  const pending = requestChat(
    '帮我关注平台 A，接收异常消息',
    previous,
    new AbortController().signal,
    () => {},
    { follows: [], platformUnread: 0 },
  )
  await vi.runAllTimersAsync()
  expect((await pending).project?.commands?.map((c) => c.platform)).toEqual(['A'])
})
it('按指定链币种和窗口计算，样本缺失不显示为零', () => {
  const r = mockProjectAnswer('analytics', '平台 A 近7天 TRON USDT 存款').project!
  expect(r.scope).toContain('7d')
  expect(r.scope).toContain('TRON')
  expect(r.scope).toContain('USDT')
  const q = { period: '7d' as const, chains: ['TRON'], tokens: ['USDT'], platforms: ['A'] }
  const stats = summarize(
    selectTransfers(analyticsLedger, q, analyticsAsOf),
    firstActivity(analyticsLedger),
    analyticsAsOf - 7 * day,
  )
  expect(r.table?.rows[0]?.[1]).toBe(`${money(stats.deposits)} / ${money(stats.withdrawals)}`)
  const missing = mockProjectAnswer('analytics', '平台 C 近30天存款').project!
  expect(missing.table?.rows[0]?.slice(1)).toEqual(['暂无数据', '暂无数据'])
})
