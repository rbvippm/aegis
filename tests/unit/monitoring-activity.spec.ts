import { afterEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { median, platformActivities, preferredPlatforms } from '@/features/monitoring/activity'
import { monitoringPlatforms } from '@/mocks/monitoring-platforms'
import type { LedgerTransfer } from '@/features/monitoring/analytics-model'
import { day } from '@/features/monitoring/analytics-model'
afterEach(() => {
  localStorage.clear()
  vi.unstubAllEnvs()
  vi.resetModules()
})
it('无关注取盾牌分前三，有关注只取所关注的平台且不修改原始排序', () => {
  expect(preferredPlatforms(monitoringPlatforms, []).map((p) => p.id)).toEqual(['A', 'J', 'F'])
  expect(preferredPlatforms(monitoringPlatforms, ['B', 'C']).map((p) => p.id)).toEqual(['B', 'C'])
  expect(preferredPlatforms(monitoringPlatforms, ['unknown']).map((p) => p.id)).toEqual([
    'A',
    'J',
    'F',
  ])
})
it('大额阈值、7天边界、内部转账和未来记录分开处理', () => {
  const base: LedgerTransfer = {
    id: 'a',
    platform: 'A',
    chain: 'TRON',
    token: 'USDT',
    wallet: 'public',
    time: 10 * day,
    usd: 100000,
    direction: 'withdrawal',
  }
  const events = platformActivities(
    [
      base,
      { ...base, id: 'small', usd: 99999 },
      { ...base, id: 'internal', usd: 2, direction: 'internal' },
      { ...base, id: 'old', time: 3 * day },
      { ...base, id: 'future', time: 11 * day },
    ],
    monitoringPlatforms.filter((p) => p.id === 'A'),
    10 * day,
  )
  expect(events.map((e) => e.id).sort()).toEqual(['a', 'internal'])
  expect(events.find((e) => e.id === 'internal')?.kind).toBe('transfer')
  expect(median([])).toBeNull()
  expect(median([9, 1, 3])).toBe(3)
  expect(median([10, 2])).toBe(6)
})
it('关注生成去重站内通知，已读跨刷新保存，关闭平台通知后不新增', async () => {
  vi.stubEnv('VITE_DATA_MODE', 'demo')
  vi.resetModules()
  setActivePinia(createPinia())
  const { usePlatformFollows } = await import('@/features/monitoring/follows')
  const { useProfile } = await import('@/features/profile/store')
  const follows = usePlatformFollows(),
    profile = useProfile()
  follows.toggle('A')
  await nextTick()
  const first = profile.notices.filter((n) => n.id.startsWith('monitor:'))
  expect(first.length).toBeGreaterThan(0)
  expect(first.every((n) => n.target.startsWith('/monitor?platform=A&event='))).toBe(true)
  first[0]!.read = true
  await nextTick()
  follows.toggle('A')
  follows.toggle('A')
  await nextTick()
  expect(profile.notices.filter((n) => n.id.startsWith('monitor:'))).toHaveLength(first.length)
  const savedId = first[0]!.id
  setActivePinia(createPinia())
  const restored = usePlatformFollows(),
    restoredProfile = useProfile()
  expect(restored.ids).toEqual(['A'])
  expect(restoredProfile.notices.find((n) => n.id === savedId)?.read).toBe(true)
  restoredProfile.preferences.platform = false
  restored.toggle('B')
  await nextTick()
  expect(
    restoredProfile.notices.some(
      (n) => n.id.startsWith('monitor:') && n.target.includes('platform=B'),
    ),
  ).toBe(false)
})
it('API模式不生成演示异常或平台关注成功状态', async () => {
  vi.stubEnv('VITE_DATA_MODE', 'api')
  vi.resetModules()
  setActivePinia(createPinia())
  const { usePlatformFollows } = await import('@/features/monitoring/follows')
  const follows = usePlatformFollows()
  follows.toggle('A')
  expect(follows.activities).toEqual([])
  expect(follows.ids).toEqual([])
})
