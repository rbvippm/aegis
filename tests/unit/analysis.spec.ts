import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAnalysis } from '@/features/ai/store'
import { usePreferences } from '@/stores/preferences'
beforeEach(() => {
  setActivePinia(createPinia())
  vi.useRealTimers()
})
describe('AI 请求生命周期', () => {
  it('停止后不提交结果，且能重试', async () => {
    vi.useFakeTimers()
    const store = useAnalysis()
    const first = store.ask('海港队对山城队，你怎么看？')
    store.stop()
    await first
    expect(store.cancelled).toBe(true)
    expect(store.result).toBeNull()
    const retry = store.ask(store.question)
    await vi.runAllTimersAsync()
    await retry
    expect(store.result?.fixture.id).toBe('demo-harbor-mountain')
    expect(store.busy).toBe(false)
  })
  it('重置后旧请求不覆盖新状态', async () => {
    const store = useAnalysis()
    const pending = store.ask('海港队对山城队，你怎么看？')
    store.reset()
    await pending
    expect(store.question).toBe('')
    expect(store.result).toBeNull()
    expect(store.error).toBe('')
  })
  it('错误不回退为成功结果', async () => {
    vi.useFakeTimers()
    usePreferences().scenario = 'error'
    const store = useAnalysis()
    const pending = store.ask('海港队对山城队，你怎么看？')
    await vi.runAllTimersAsync()
    await pending
    expect(store.error).toContain('暂时不可用')
    expect(store.result).toBeNull()
  })
})
