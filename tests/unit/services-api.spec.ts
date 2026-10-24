import { describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
vi.mock('@/shared/api/config', () => ({ dataMode: 'api' }))
import VipService from '@/features/services/VipService.vue'
import AgentQuotes from '@/features/services/AgentQuotes.vue'
import { useServiceRequests } from '@/features/services/store'

describe('真实模式不回退演示报价', () => {
  it('两个页面不展示演示报价、评级或匿名榜，禁止提交', () => {
    for (const component of [VipService, AgentQuotes]) {
      setActivePinia(createPinia())
      const wrapper = mount(component, {
        global: { stubs: { RouterLink: true, BottomDrawer: true } },
      })
      expect(wrapper.text()).toMatch(/暂无/)
      expect(wrapper.text()).not.toContain('平台 A')
      expect(wrapper.text()).not.toContain('鲸鱼 #')
      expect(wrapper.find('.svc-hero button').attributes('disabled')).toBeDefined()
      expect(
        useServiceRequests().save({
          kind: 'vip',
          volume: '1–5万 U',
          tier: 'VIP 4–6',
          preference: '日返水',
          note: '',
        }),
      ).toBe(false)
      wrapper.unmount()
    }
  })
})
