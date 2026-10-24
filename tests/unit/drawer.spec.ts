import { afterEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})
it('迟到的原生关闭事件不会再次通知父组件或关闭新面板', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
  const wrapper = mount(BottomDrawer, {
    props: { open: true, title: '旧面板' },
    attachTo: document.body,
  })
  await nextTick()
  await nextTick()
  await wrapper.get('button[aria-label="关闭面板"]').trigger('click')
  await vi.advanceTimersByTimeAsync(240)
  expect(wrapper.emitted('close')).toHaveLength(1)
  await wrapper.setProps({ open: false })
  await wrapper.setProps({ open: true, title: '新面板' })
  await nextTick()
  await wrapper.get('dialog').trigger('close')
  expect(wrapper.emitted('close')).toHaveLength(1)
  expect(wrapper.get('dialog').attributes('open')).toBeDefined()
  wrapper.unmount()
  vi.unstubAllGlobals()
})
