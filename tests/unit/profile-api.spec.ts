import { expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
vi.mock('@/shared/api/config', () => ({ dataMode: 'api' }))
import { useProfile } from '@/features/profile/store'
it('真实模式不加载演示身份、收益和工单，禁止保存模拟业务', () => {
  setActivePinia(createPinia())
  const profile = useProfile()
  expect(profile.previewIdentity).toBe(false)
  expect(profile.records).toEqual([])
  expect(profile.bindings).toEqual([])
  expect(profile.tickets).toEqual([])
  expect(profile.bind('A', 'uid_123')).toContain('暂时无法保存')
  expect(profile.saveFeedback('其他', '足够长度的问题反馈内容。', '')).toContain('暂时无法提交反馈')
  profile.logout()
  expect(profile.bindings).toEqual([])
  expect(profile.tickets).toEqual([])
})
