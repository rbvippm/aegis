import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestChat } from '@/features/ai/conversation-service'
import { mockProjectAnswer, resolveProjectScenario } from '@/mocks/ai-project'
import type { ProjectScenario } from '@/features/ai/conversation-types'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
const cases: [string, ProjectScenario][] = [
  ['今晚海港队对山城队，你怎么看？', 'match'],
  ['北辰队对南岳队，同盘口报价怎么比较？', 'odds'],
  ['帮我分析套利机会与预算分配', 'arbitrage'],
  ['帮我解读滚球盘口与水位变化', 'movements'],
  ['哪家平台出金更稳定？', 'monitor'],
  ['比较 VIP 方案时，应该核对哪些条款？', 'vip'],
  ['比较代理佣金时，应该核对哪些扣费与结算条款？', 'agents'],
  ['帮我整理出金进度咨询的事实和材料，不要自动提交', 'tickets'],
  ['如何核对平台UID、奖励资格和出金记录？', 'binding'],
]
describe('项目 AI mock 场景', () => {
  it.each(cases)('%s 匹配独立分析', async (question, scenario) => {
    expect(resolveProjectScenario(question)).toBe(scenario)
    const pending = requestChat(question, undefined, new AbortController().signal, () => {})
    await vi.runAllTimersAsync()
    const answer = await pending
    expect(answer.project?.scenario).toBe(scenario)
    expect(answer.project?.reasons.length).toBeGreaterThan(0)
    expect(answer.project?.plan.length).toBeGreaterThan(0)
    expect(answer.sources[0]?.status).toContain('mock')
  })
  it('大小球与胜负市场不会回退到让球盘口，较优平台随方向计算', () => {
    const total = mockProjectAnswer('odds', '海港队对山城队总进球 2.5 报价')
    expect(total.project?.scope).toContain('总进球 2.5')
    expect(total.project?.table?.title).toContain('大 2.5')
    const winner = mockProjectAnswer('odds', '北辰队对南岳队主胜报价')
    expect(winner.summary).toContain('平台 A的港盘 1.10')
    expect(winner.project?.scope).toContain('两项结果')
  })
  it('未知赛事不套用已有球队的推荐或报价', () => {
    expect(resolveProjectScenario('维拉对曼城的同盘口报价怎么看？')).toBeUndefined()
    expect(resolveProjectScenario('皇马 vs 巴萨的赔率怎么看？')).toBeUndefined()
    expect(resolveProjectScenario('今晚皇马对巴萨赔率推荐')).toBeUndefined()
  })
  it('业务追问保留原赛事，跨场景不继承无关数据', async () => {
    const initial = mockProjectAnswer('match', '北辰队对南岳队怎么看')
    const pending = requestChat(
      initial.followups[0]!,
      initial,
      new AbortController().signal,
      () => {},
    )
    await vi.runAllTimersAsync()
    const answer = await pending
    expect(answer.project?.title).toContain('北辰队')
    expect(answer.project?.scenario).toBe('odds')
    const next = requestChat('比较 VIP 条款', answer, new AbortController().signal, () => {})
    await vi.runAllTimersAsync()
    expect((await next).project?.scenario).toBe('vip')
  })
  it('监测使用平均值，未知样本不与欢迎页中位数混算', () => {
    const answer = mockProjectAnswer('monitor', '平台 B 热钱包')
    expect(answer.summary).toContain('8 分钟')
    expect(answer.project?.details[0]?.text).toContain('另一组条件')
    expect(answer.project?.table?.rows.map((row) => row[0])).toEqual(['平台 B'])
    expect(mockProjectAnswer('monitor', '平台 C 热钱包').project?.table?.rows[0]?.[1]).toBe(
      '样本不足',
    )
  })
  it('模板与资格流程不虚构真实提交或授权', () => {
    expect(mockProjectAnswer('tickets', '工单').project?.plan.join()).toContain('不代为提交')
    expect(mockProjectAnswer('binding', 'UID').summary).toContain('不代表')
    expect(mockProjectAnswer('agents', '代理').project?.details[0]?.text).toContain('7 日')
  })
})
