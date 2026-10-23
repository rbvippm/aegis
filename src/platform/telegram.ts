import type { PlatformAdapter, TelegramWebApp } from './types'
import { syncVisualViewport } from './web'
export function hasTelegramLaunch(): boolean {
  const params = new URLSearchParams(window.location.hash.slice(1))
  return (
    Boolean(window.Telegram?.WebApp?.initData) ||
    (params.has('tgWebAppData') && params.has('tgWebAppVersion'))
  )
}
async function loadBridge(): Promise<TelegramWebApp> {
  if (window.Telegram?.WebApp) return window.Telegram.WebApp
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(() => {
      script.remove()
      reject(new Error('Telegram 连接超时'))
    }, 8000)
    script.src = 'https://telegram.org/js/telegram-web-app.js'
    script.async = true
    script.onload = () => {
      clearTimeout(timer)
      resolve()
    }
    script.onerror = () => {
      clearTimeout(timer)
      script.remove()
      reject(new Error('无法连接 Telegram'))
    }
    document.head.appendChild(script)
  })
  if (!window.Telegram?.WebApp) throw new Error('Telegram 环境不可用')
  return window.Telegram.WebApp
}
export function createTelegramAdapter(): PlatformAdapter {
  let dispose = () => {}
  return {
    kind: 'telegram',
    async init(router) {
      const app = await loadBridge()
      // Bridge metadata is a UI capability only; it never establishes an authenticated session.
      const sync = () => {
        syncVisualViewport()
        if (app.isFullscreen) {
          const top = Math.max(app.safeAreaInset?.top ?? 0, app.contentSafeAreaInset?.top ?? 0)
          const bottom = Math.max(
            app.safeAreaInset?.bottom ?? 0,
            app.contentSafeAreaInset?.bottom ?? 0,
          )
          document.documentElement.style.setProperty('--ae-safe-top', `${top}px`)
          document.documentElement.style.setProperty('--ae-safe-bottom', `${bottom}px`)
        }
      }
      const back = () => {
        if (window.history.state?.back) router.back()
        else void router.push('/')
      }
      const updateBack = () => {
        if (router.currentRoute.value.path === '/') app.BackButton.hide()
        else app.BackButton.show()
      }
      const removeRouteHook = router.afterEach(updateBack)
      app.BackButton.onClick(back)
      for (const name of [
        'viewportChanged',
        'safeAreaChanged',
        'contentSafeAreaChanged',
        'fullscreenChanged',
      ])
        app.onEvent(name, sync)
      window.visualViewport?.addEventListener('resize', sync)
      if (app.isVersionAtLeast('6.1')) {
        app.setHeaderColor('#f5f8ff')
        app.setBackgroundColor('#f5f8ff')
      }
      app.ready()
      app.expand()
      sync()
      updateBack()
      dispose = () => {
        removeRouteHook()
        app.BackButton.offClick(back)
        app.BackButton.hide()
        for (const name of [
          'viewportChanged',
          'safeAreaChanged',
          'contentSafeAreaChanged',
          'fullscreenChanged',
        ])
          app.offEvent(name, sync)
        window.visualViewport?.removeEventListener('resize', sync)
        document.documentElement.style.removeProperty('--ae-safe-top')
        document.documentElement.style.removeProperty('--ae-safe-bottom')
      }
    },
    dispose: () => dispose(),
  }
}
