import { afterEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import drawerSource from '@/shared/ui/BottomDrawer.vue?raw'
import planningStyles from '@/features/sports/planning/planning.css?raw'
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

it('监测与体育页关闭按钮的圆形背景、边框和触控尺寸一致', () => {
  const styles = document.createElement('style')
  styles.textContent = `${drawerSource.split('<style>')[1]!.split('</style>')[0]}\n${planningStyles}`
  document.head.append(styles)
  const host = document.createElement('div')
  document.body.append(host)
  const wrapper = mount(BottomDrawer, { props: { open: false, title: '筛选条件' }, attachTo: host })
  try {
    const button = wrapper.get('.ae-drawer__close').element
    const values = () => {
      const css = getComputedStyle(button)
      return [
        css.backgroundColor,
        css.color,
        css.borderTopWidth,
        css.borderRadius,
        css.width,
        css.height,
      ]
    }
    const monitor = values()
    host.className = 'sports-page pw-workspace'
    expect(values()).toEqual(monitor)
    expect(monitor).toEqual([
      'rgb(231, 240, 249)',
      'rgb(61, 93, 134)',
      '1px',
      '50%',
      '44px',
      '44px',
    ])
    expect(wrapper.get('.ae-drawer__close svg').attributes('stroke-width')).toBe('2.25')
  } finally {
    wrapper.unmount()
    host.remove()
    styles.remove()
  }
})
