import { describe, expect, it, vi } from 'vitest'
vi.mock('@/shared/api/config', () => ({ dataMode: 'api' }))
import { requestChat } from '@/features/ai/conversation-service'
describe('真实模式边界', () => {
  it.each([
    '维拉 vs 曼城',
    '海港队对山城队怎么看',
    '比较 VIP 条款',
    '整理工单材料',
    '代理佣金试算',
  ])('真实模式不返回 mock：%s', async (question) => {
    await expect(
      requestChat(question, undefined, new AbortController().signal, () => {}),
    ).rejects.toThrow('暂时无法生成回答')
  })
})
