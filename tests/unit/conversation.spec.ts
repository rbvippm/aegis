import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConversation } from '@/features/ai/conversation-store'
import { requestChat, resolveChatKind } from '@/features/ai/conversation-service'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('对话上下文与请求隔离', () => {
  it('只有明确样例和已知追问继承上下文，其他赛事不套用推荐', () => {
    expect(resolveChatKind('维拉 vs 曼城')).toBe('sports')
    expect(resolveChatKind('TRON 小额出金')).toBe('funding')
    expect(resolveChatKind('为什么选受让？', 'sports')).toBe('sports')
    expect(resolveChatKind('皇马 vs 巴萨怎么看？', 'sports')).toBe('clarify')
    expect(resolveChatKind('同盘口哪家更好？')).toBe('clarify')
  })
  it('停止后旧请求不能覆盖新会话，重试保留同一问题', async () => {
    const store = useConversation()
    const first = store.send('维拉 vs 曼城')
    store.stop()
    const id = store.messages[0]!.id
    expect(store.messages[0]?.status).toBe('stopped')
    await vi.runAllTimersAsync()
    await first
    expect(store.messages[0]?.answer).toBeUndefined()
    const retry = store.retry(id)
    await vi.runAllTimersAsync()
    await retry
    expect(store.messages).toHaveLength(1)
    expect(store.messages[0]?.answer?.kind).toBe('sports')
    const old = store.activeId
    const pending = store.send('TRON 出金')
    store.newConversation()
    await vi.runAllTimersAsync()
    await pending
    expect(store.messages).toEqual([])
    store.restore(old)
    expect(store.messages.at(-1)?.status).toBe('stopped')
  })
  it('大额样本缺失时不沿用小额排名', async () => {
    const pending = requestChat('大额出金呢？', 'funding', new AbortController().signal, () => {})
    await vi.runAllTimersAsync()
    const answer = await pending
    expect(answer.kind).toBe('clarify')
    expect(answer.summary).toContain('不能把小额耗时直接用于大额推荐')
  })
  it('会话历史只在内存保留，可切换并删除', async () => {
    const store = useConversation()
    const first = store.send('维拉 vs 曼城')
    await vi.runAllTimersAsync()
    await first
    const sports = store.activeId
    store.newConversation()
    const second = store.send('TRON 出金')
    await vi.runAllTimersAsync()
    await second
    expect(store.conversations).toHaveLength(2)
    store.restore(sports)
    expect(store.messages[0]?.answer?.kind).toBe('sports')
    store.remove(sports)
    expect(store.activeId).toBe('')
    expect(store.conversations).toHaveLength(1)
  })
})
