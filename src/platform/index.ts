import { reactive } from 'vue'
import type { Router } from 'vue-router'
import { createWebAdapter } from './web'
import { createTelegramAdapter, hasTelegramLaunch } from './telegram'
export const platformState = reactive({
  kind: 'web' as 'web' | 'telegram',
  ready: false,
  warning: '',
})
export async function initPlatform(router: Router) {
  let adapter = hasTelegramLaunch() ? createTelegramAdapter() : createWebAdapter()
  try {
    await adapter.init(router)
    platformState.kind = adapter.kind
  } catch {
    adapter.dispose()
    platformState.warning = 'Telegram 宿主暂不可用，已使用网页模式。'
    adapter = createWebAdapter()
    await adapter.init(router)
  }
  platformState.ready = true
  window.addEventListener('pagehide', adapter.dispose, { once: true })
  if (import.meta.hot) import.meta.hot.dispose(adapter.dispose)
}
