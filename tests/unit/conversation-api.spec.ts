import { describe, expect, it, vi } from 'vitest'
vi.mock('@/shared/api/config', () => ({ dataMode: 'api' }))
import { requestChat } from '@/features/ai/conversation-service'
describe('真实模式边界', () => {
  it('服务未接入时明确失败，不返回示例推荐', async () => {
    await expect(
      requestChat('维拉 vs 曼城', undefined, new AbortController().signal, () => {}),
    ).rejects.toThrow('AI 与内部知识库服务尚未接入')
  })
})
