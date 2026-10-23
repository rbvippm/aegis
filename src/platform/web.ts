import type { PlatformAdapter } from './types'
export function syncVisualViewport() {
  const viewport = window.visualViewport
  const height = viewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--ae-viewport-height', `${height}px`)
  document.documentElement.style.setProperty(
    '--ae-keyboard-offset',
    `${Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0))}px`,
  )
}
export function createWebAdapter(): PlatformAdapter {
  return {
    kind: 'web',
    init() {
      syncVisualViewport()
      window.visualViewport?.addEventListener('resize', syncVisualViewport)
    },
    dispose() {
      window.visualViewport?.removeEventListener('resize', syncVisualViewport)
    },
  }
}
