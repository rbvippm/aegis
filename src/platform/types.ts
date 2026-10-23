import type { Router } from 'vue-router'
export interface PlatformAdapter {
  kind: 'web' | 'telegram'
  init: (router: Router) => void | Promise<void>
  dispose: () => void
}
export interface TelegramWebApp {
  initData: string
  isFullscreen?: boolean
  viewportStableHeight?: number
  safeAreaInset?: { top: number; bottom: number }
  contentSafeAreaInset?: { top: number; bottom: number }
  ready: () => void
  expand: () => void
  isVersionAtLeast: (version: string) => boolean
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  onEvent: (name: string, callback: () => void) => void
  offEvent: (name: string, callback: () => void) => void
  BackButton: {
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
}
declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}
