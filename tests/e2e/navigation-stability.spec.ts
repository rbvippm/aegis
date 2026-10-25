import { test, expect } from '@playwright/test'

const paths = ['/me', '/ai', '/compare', '/ai', '/me', '/compare']
for (const width of [360, 390, 430]) {
  test(`${width}px 主导航逐帧保持完整页面，无退场闪白或外壳错位`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    // Keep normal animation settings so reduced-motion cannot mask a regression.
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/compare')
    await expect(page.locator('.pw-workspace')).toBeVisible()
    const initialDock = await page.locator('.ae-dock').boundingBox()
    for (const to of paths) {
      const frames = await page.evaluate(async (to) => {
        const frames: {
          path: string
          root: string
          opacity: number
          transform: string
          header: boolean
          left: number
          width: number
          dockTop: number
          dockWidth: number
        }[] = []
        const started = performance.now()
        ;(document.querySelector(`.ae-dock a[href="${to}"]`) as HTMLAnchorElement).click()
        await new Promise<void>((resolve) => {
          function sample() {
            const root = document.querySelector('#main-content')?.firstElementChild
            const dock = document.querySelector('.ae-dock')!.getBoundingClientRect()
            frames.push({
              path: location.pathname,
              root: root?.className ?? '',
              opacity: root ? Number(getComputedStyle(root).opacity) : 0,
              transform: root ? getComputedStyle(root).transform : '',
              header: !!document.querySelector('.site-header'),
              left: root?.getBoundingClientRect().left ?? 0,
              width: root?.getBoundingClientRect().width ?? 0,
              dockTop: dock.top,
              dockWidth: dock.width,
            })
            if (performance.now() - started < 450 || location.pathname !== to) {
              if (performance.now() - started > 5000) return resolve()
              requestAnimationFrame(sample)
            } else resolve()
          }
          requestAnimationFrame(sample)
        })
        return frames
      }, to)
      expect(frames.at(-1)?.path).toBe(to)
      for (const frame of frames) {
        expect(frame.root).toContain(
          frame.path === '/compare' ? 'pw-workspace' : frame.path === '/ai' ? 'ac-page' : 'pf-page',
        )
        expect(frame.opacity).toBe(1)
        expect(frame.transform).toBe('none')
        expect(frame.header).toBe(frame.path === '/compare')
        expect(frame.width).toBe(frame.path === '/compare' ? width - 24 : width)
        expect(Math.abs(frame.dockTop - initialDock!.y)).toBeLessThan(1)
        expect(Math.abs(frame.dockWidth - initialDock!.width)).toBeLessThan(1)
      }
      await page.screenshot({
        path: `outputs/navigation-audit/verification/${width}-${to.slice(1)}.png`,
      })
    }
  })
}

test('快速连点、已滚动页面与历史返回不残留错误页面或样式', async ({ page }) => {
  await page.goto('/compare')
  await page.locator('#main-content').evaluate((el) => (el.scrollTop = 850))
  await page.getByRole('link', { name: '我的', exact: true }).click()
  await expect(page.locator('.pf-page')).toBeVisible()
  expect(await page.locator('#main-content').evaluate((el) => el.scrollTop)).toBe(0)
  await page.evaluate(() => {
    for (const path of ['/ai', '/compare', '/me', '/ai', '/compare', '/me'])
      (document.querySelector(`.ae-dock a[href="${path}"]`) as HTMLAnchorElement).click()
  })
  await expect(page).toHaveURL(/\/me$/)
  await expect(page.locator('.pf-page')).toBeVisible()
  await expect(page.locator('.ac-page,.pw-workspace')).toHaveCount(0)
  await expect(page.locator('.ae-dock [aria-current="page"]')).toHaveText('我的')
  await page.getByRole('link', { name: 'AI', exact: true }).click()
  await expect(page.locator('.ac-page')).toBeVisible()
  await page.goBack()
  await expect(page.locator('.pf-page')).toBeVisible()
  await expect(page.locator('.site-header')).toHaveCount(0)
})
