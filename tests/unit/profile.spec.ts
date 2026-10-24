import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useProfile } from '@/features/profile/store'
import { validateEvidence, validateTicket } from '@/features/profile/logic'
beforeEach(() => setActivePinia(createPinia()))
describe('个人中心业务边界', () => {
  it('收益汇总来自同一组整数分记录，不把待核对计入已结算', () => {
    const store = useProfile()
    expect(store.pendingCents).toBe(12850)
    expect(store.settledCents).toBe(218000)
    expect(store.boundCount).toBe(2)
  })
  it('新增与修改 UID 都不能自动获得奖励资格', () => {
    const store = useProfile()
    expect(store.bind('C', 'valid_123')).toBe('')
    expect(store.boundCount).toBe(3)
    expect(store.bindings.find((item) => item.id === 'C')?.eligibility).toBe('pending')
    expect(store.bind('A', 'changed_456')).toBe('')
    expect(store.bindings.find((item) => item.id === 'A')?.eligibility).toBe('pending')
    expect(store.bind('A', 'bad uid')).not.toBe('')
  })
  it('工单只成为本地草稿，补充材料不改变服务端处理状态', () => {
    const store = useProfile()
    const result = store.saveTicket({
      platform: 'B',
      category: '出金问题',
      description: '这是一份足够详细的测试问题描述。',
      amount: '12.50',
      evidence: [],
    })
    expect(result.error).toBe('')
    const ticket = store.tickets.find((item) => item.id === result.id)
    expect(ticket?.status).toBe('draft')
    expect(ticket?.amount).toBe('12.50')
    expect(store.supplement('AE-0108', '这是补充的申请时间和交易记录描述。', [])).toBe('')
    expect(store.tickets.find((item) => item.id === 'AE-0108')?.status).toBe('materials')
  })
  it('金额与证据无效时拒绝保存，不把非法数据加入草稿', () => {
    const input = {
      platform: 'A',
      category: '其他',
      description: '这里是十个字以上的问题描述。',
      evidence: [],
    }
    expect(validateTicket({ ...input, amount: 'Infinity' })).not.toBe('')
    expect(validateTicket({ ...input, amount: '-1' })).not.toBe('')
    expect(validateTicket({ ...input, amount: '1.001' })).not.toBe('')
    expect(
      validateEvidence([{ name: 'a.exe', type: 'application/octet-stream', size: 1024 }]),
    ).not.toBe('')
    expect(
      validateEvidence([{ name: 'a.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 }]),
    ).not.toBe('')
  })
  it('游客不可保存 UID，退出预览清除个人草稿和反馈', () => {
    const store = useProfile()
    store.bind('C', 'example_uid')
    store.saveFeedback('建议', '希望这里增加更清晰的数据来源。', '')
    store.logout()
    expect(store.bind('C', 'example_uid')).not.toBe('')
    expect(store.feedback).toEqual([])
    expect(store.bindings.find((item) => item.id === 'C')?.uid).toBe('')
  })
})
