import { test, expect } from '@playwright/test'

for (const width of [360, 390, 430]) {
  test(`${width}px 首页能力 Banner 切换与边界`, async ({ page }) => {
    await page.setViewportSize({ width, height: 932 })
    await page.goto('/')
    const banner = page.getByRole('region', { name: '平台能力介绍' })
    const dots = banner.getByRole('button')
    await expect(dots).toHaveCount(4)
    const bounds = await page.locator('.ai-card-brand').evaluate((el) => {
      const icon = el.getBoundingClientRect()
      const card = el.closest('.ai-hero')!.getBoundingClientRect()
      const composer = el
        .closest('.ai-hero')!
        .querySelector('.ae-composer')!
        .getBoundingClientRect()
      return {
        contained: icon.top >= card.top + 8 && icon.left >= card.left + 8,
        separated: icon.bottom <= composer.top - 4,
      }
    })
    expect(bounds.contained).toBe(true)
    expect(bounds.separated).toBe(true)
    await expect(banner.getByRole('heading', { name: '看清平台，再做选择' })).toBeVisible()
    for (const [index, title] of [
      '看清平台，再做选择',
      '赛事分析，有据可循',
      '同场同盘，清晰对比',
      '关注出金，读懂变化',
    ].entries()) {
      await dots.nth(index).click()
      await expect(dots.nth(index)).toHaveAttribute('aria-current', 'true')
      await expect
        .poll(() =>
          banner
            .locator('.home-banner__track')
            .evaluate((el, position) => Math.abs(el.scrollLeft - el.clientWidth * position), index),
        )
        .toBeLessThan(1)
      await expect(banner.getByRole('heading', { name: title })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
      await page.screenshot({ path: `outputs/home-banner/${width}-${index + 1}.png` })
    }
    // Native scrolling (touch swipe) and pagination share the same active state.
    await banner
      .locator('.home-banner__track')
      .evaluate((el) => el.scrollTo({ left: 0, behavior: 'instant' }))
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
    await dots.nth(0).focus()
    await page.keyboard.press('ArrowRight')
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
  })
}

test('Banner 每 5 秒循环，手动切换重新计时', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-24T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-10-24T00:00:01Z'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const banner = page.getByRole('region', { name: '平台能力介绍' })
  const dots = banner.getByRole('button')
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  await page.clock.runFor(4999)
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  await page.clock.runFor(1)
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
  await page.clock.runFor(5000)
  await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true')
  await page.clock.runFor(5000)
  await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true')
  await page.clock.runFor(5000)
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  await dots.nth(2).click()
  await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true')
  await page.clock.runFor(4999)
  await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true')
  await page.clock.runFor(1)
  await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true')
})
