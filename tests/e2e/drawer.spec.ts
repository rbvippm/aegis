import { test, expect } from '@playwright/test'

for (const route of ['monitor', 'compare']) {
  test(`${route} 抽屉支持点击、下拉两级收起及焦点返回`, async ({ page }) => {
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
    await handle.focus()
    await page.keyboard.press('ArrowUp')
    await expect(drawer).toHaveAttribute('data-detent', 'expanded')
    await page.keyboard.press('ArrowDown')
    await expect(drawer).toHaveAttribute('data-detent', 'half')
    const heightRatio = () =>
      drawer.evaluate(
        (el) => el.getBoundingClientRect().height / (window.visualViewport?.height ?? innerHeight),
      )
    await expect.poll(heightRatio).toBeCloseTo(0.5, 2)
    await handle.click()
    await expect(drawer).not.toBeVisible()
    await trigger.click()
    await handle.focus()
    await page.keyboard.press('ArrowUp')
    await expect(drawer).toHaveAttribute('data-detent', 'expanded')
    await expect.poll(heightRatio).toBeCloseTo(0.9, 2)
    // Actual touch gestures exercise pointer capture and scroll isolation on mobile.
    const session = await page.context().newCDPSession(page)
    async function pull(distance: number) {
      const box = await handle.boundingBox()
      if (!box) throw new Error('Missing drawer handle')
      const x = box.x + box.width / 2
      const y = box.y + box.height / 2
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
      })
      for (let step = 1; step <= 8; step++) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: y + (distance * step) / 8 }],
        })
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    await pull(120)
    await expect(drawer).toHaveAttribute('data-detent', 'half')
    await page.waitForTimeout(350)
    await page.screenshot({ path: `outputs/drawer-review/${route}-half.png` })
    await pull(120)
    await expect(drawer).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(drawer).toBeVisible()
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
      await page.keyboard.press('ArrowUp')
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
  await page.keyboard.press('ArrowUp')
  await expect(drawer).toHaveAttribute('data-detent', 'expanded')
  await page.keyboard.press('ArrowDown')
  await expect(drawer).toHaveAttribute('data-detent', 'half')
  await page.keyboard.press('ArrowDown')
  await expect(drawer).not.toBeVisible()
})
