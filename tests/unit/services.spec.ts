import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { estimateCommission } from '@/features/services/logic'
import { useServiceRequests } from '@/features/services/store'
import { agentPolicies } from '@/mocks/services'

describe('佣金口径与匿名演示需求', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('先扣场馆费再分成，其他扣减也先于分成', () => {
    expect(estimateCommission(10000, agentPolicies[0]!)).toBe(3680)
    expect(estimateCommission(10000, agentPolicies[1]!)).toBe(3960)
    expect(estimateCommission(10000, agentPolicies[0]!, 200)).toBe(3600)
    expect(estimateCommission(100, agentPolicies[0]!, 1000)).toBe(0)
    expect(estimateCommission(11.11, { commission: 33.33, venueFee: 7.5 })).toBe(3.43)
  })
  it('拒绝缺失、负数、无穷和越界百分比', () => {
    for (const value of [NaN, Infinity, -1, 1e13])
      expect(estimateCommission(value, agentPolicies[0]!)).toBeNull()
    expect(estimateCommission(0, agentPolicies[0]!)).toBe(0)
    expect(estimateCommission(100, { commission: 101, venueFee: 8 })).toBeNull()
    expect(estimateCommission(100, { commission: 40, venueFee: -1 })).toBeNull()
    expect(estimateCommission(100, agentPolicies[0]!, NaN)).toBeNull()
  })
  it('只在内存保存演示需求，不向平台请求或持久化', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    const store = useServiceRequests()
    expect(
      store.save({
        kind: 'vip',
        volume: '1–5万 U',
        tier: 'VIP 4–6',
        preference: '专属日返水',
        note: '  流水要求  ',
      }),
    ).toBe(true)
    expect(store.requests.vip?.note).toBe('流水要求')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
    store.remove('vip')
    expect(store.requests.vip).toBeUndefined()
    vi.restoreAllMocks()
  })
})
