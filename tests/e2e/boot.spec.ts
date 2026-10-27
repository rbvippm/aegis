import { test, expect } from '@playwright/test'

test('脚本下载期间已有品牌首屏，应用就绪后退出且站内切换不重播', async ({ page }) => {
  let release!: () => void
  const downloading = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/src/main.ts', async (route) => {
    await downloading
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  const boot = page.getByRole('status', { name: '正在打开 Aegis' })
  await expect(boot).toBeVisible()
  await expect(page.locator('#app')).toHaveAttribute('inert', '')
  await expect(boot.getByRole('link', { name: '重新加载' })).toBeHidden()
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    const layout = await boot.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      const content = element.querySelector('.boot-content')!.getBoundingClientRect()
      return {
        covers: bounds.width === innerWidth && bounds.height === innerHeight,
        fits: content.left >= 0 && content.right <= innerWidth && content.bottom <= innerHeight,
        background: getComputedStyle(element).backgroundImage,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }
    })
    expect(layout.covers && layout.fits).toBe(true)
    expect(layout.overflow).toBe(false)
    expect(layout.background).toContain('radial-gradient')
  }
  release()
  await expect(
    page.getByRole('heading', { name: '想了解什么？问问 AI', exact: true }),
  ).toBeVisible()
  await expect(page.locator('#app-boot')).toHaveCount(0)
  await expect(page.locator('#app')).not.toHaveAttribute('inert')
  await page
    .getByRole('navigation', { name: '主导航', exact: true })
    .getByRole('link', { name: '监测', exact: true })
    .click()
  await expect(page).toHaveURL(/\/monitor$/)
  await expect(page.locator('#app-boot')).toHaveCount(0)
})

test('等待深层链接的异步页面，减少动效时无加载动画', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let release!: () => void
  const downloading = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/src/pages/AiPage.vue', async (route) => {
    await downloading
    await route.continue()
  })
  await page.goto('/ai', { waitUntil: 'commit' })
  const boot = page.locator('#app-boot')
  await expect(boot).toBeVisible()
  expect(
    await boot.evaluate((element) => ({
      transition: getComputedStyle(element).transitionDuration,
      animation: getComputedStyle(element.querySelector('.boot-progress')!, '::after')
        .animationName,
    })),
  ).toEqual({ transition: '0s', animation: 'none' })
  await expect(page.locator('#main-content')).toBeEmpty()
  release()
  await expect(page.locator('#main-content > *').first()).toBeVisible()
  await expect(boot).toHaveCount(0)
})

test('初始路由加载失败可重试，不会永久遮挡', async ({ page }) => {
  let fail = true
  await page.route('**/src/pages/AiPage.vue', (route) => {
    if (fail) {
      fail = false
      return route.abort()
    }
    return route.continue()
  })
  await page.goto('/ai', { waitUntil: 'commit' })
  const boot = page.getByRole('status', { name: '页面加载失败，请重新加载' })
  await expect(boot).toBeVisible()
  await boot.getByRole('link', { name: '重新加载' }).click()
  await expect(page.locator('#main-content > *').first()).toBeVisible()
  await expect(page.locator('#app-boot')).toHaveCount(0)
})
