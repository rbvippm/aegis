import { test, expect } from '@playwright/test'

for (const route of ['monitor', 'compare']) {
  test(`${route} 抽屉上拉最高、慢拉半收起、快拉与长拉关闭`, async ({ page }) => {
    await page.goto(`/${route}`)
    const trigger = page.getByRole('button', {
      name: route === 'monitor' ? '筛选平台' : '识别',
      exact: true,
    })
    await trigger.click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    const handle = drawer.locator('.ae-drawer__handle')
    await handle.click()
    await expect(drawer).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(drawer).toHaveAttribute('data-detent', 'fit')
    const heightRatio = () =>
      drawer.evaluate(
        (el) => el.getBoundingClientRect().height / (window.visualViewport?.height ?? innerHeight),
      )
    const ratio = await heightRatio()
    expect(ratio).toBeGreaterThanOrEqual(0.59)
    expect(ratio).toBeLessThanOrEqual(0.81)
    const session = await page.context().newCDPSession(page)
    async function pull(distance: number, stepDelay = 60) {
      await drawer.evaluate((el) =>
        Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => {}))),
      )
      await expect
        .poll(() =>
          drawer.evaluate((el) => Math.abs(el.getBoundingClientRect().bottom - innerHeight)),
        )
        .toBeLessThan(2)
      const box = await drawer.locator('.ae-drawer__header').boundingBox()
      if (!box) throw new Error('Missing drawer header')
      const x = box.x + 28
      const y = box.y + box.height / 2
      const leftBefore = (await drawer.boundingBox())?.x ?? 0
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
      })
      for (let step = 1; step <= 8; step++) {
        await page.waitForTimeout(stepDelay)
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: y + (distance * step) / 8 }],
        })
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      return leftBefore
    }
    await expect(drawer).toBeFocused()
    expect(await handle.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none')
    await pull(-180)
    await expect(drawer).toHaveAttribute('data-detent', 'expanded')
    await expect.poll(heightRatio).toBeGreaterThan(0.79)
    expect(await heightRatio()).toBeLessThanOrEqual(0.801)
    await page.screenshot({ path: `outputs/drawer-review/${route}-manual-max.png` })
    await pull(90)
    await expect(drawer).toHaveAttribute('data-detent', 'half')
    await expect.poll(heightRatio).toBeLessThan(0.62)
    await page.screenshot({ path: `outputs/drawer-review/${route}-half.png` })
    await pull(-120)
    await expect(drawer).toHaveAttribute('data-detent', 'expanded')
    await expect.poll(heightRatio).toBeGreaterThan(0.79)
    expect(await heightRatio()).toBeLessThanOrEqual(0.801)
    await pull(150, 5)
    await expect(drawer).not.toBeVisible()
    await trigger.click()
    await expect(drawer).toHaveAttribute('data-detent', 'fit')
    const leftBefore = await pull(48)
    await expect(drawer).toBeVisible()
    await expect.poll(heightRatio).toBeGreaterThanOrEqual(0.59)
    expect(Math.abs(((await drawer.boundingBox())?.x ?? 0) - leftBefore)).toBeLessThan(1)
    await pull(280)
    await expect(drawer).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(drawer).toBeVisible()
    await handle.focus()
    await page.keyboard.press('ArrowDown')
    await expect(drawer).not.toBeVisible()
    await trigger.click()
    await page.keyboard.press('Escape')
    await expect(drawer).not.toBeVisible()
  })
}

for (const width of [360, 390, 430]) {
  test(`${width}px 页面和抽屉视觉检查`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    for (const route of ['monitor', 'compare']) {
      await page.goto(`/${route}`)
      await page.waitForTimeout(350)
      await page.screenshot({
        path: `outputs/drawer-review/after-${route}-${width}.png`,
        fullPage: true,
      })
      await page
        .getByRole('button', { name: route === 'monitor' ? '筛选平台' : '识别', exact: true })
        .click()
      const drawer = page.getByRole('dialog')
      await expect(drawer).toBeVisible()
      await drawer.locator('.ae-drawer__handle').focus()
      await page.waitForTimeout(350)
      await page.screenshot({ path: `outputs/drawer-review/${route}-expanded-${width}.png` })
      expect(await drawer.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(false)
      const body = drawer.locator('.ae-drawer__body')
      await body.evaluate((el) => {
        el.scrollTop = el.scrollHeight
      })
      await expect(drawer.locator('.ae-drawer__handle')).toBeInViewport()
      await page.keyboard.press('Escape')
      await expect(drawer).not.toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
    }
  })
}

test('减少动效时抽屉键盘操作与关闭仍可用', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/compare')
  await page.getByRole('button', { name: '识别', exact: true }).click()
  const drawer = page.getByRole('dialog')
  const handle = drawer.locator('.ae-drawer__handle')
  await handle.focus()
  await expect(drawer).toHaveAttribute('data-detent', 'fit')
  await page.keyboard.press('ArrowUp')
  await expect(drawer).toHaveAttribute('data-detent', 'expanded')
  await page.keyboard.press('ArrowDown')
  await expect(drawer).toHaveAttribute('data-detent', 'half')
  await page.keyboard.press('ArrowDown')
  await expect(drawer).not.toBeVisible()
})
