import { test, expect } from '@playwright/test'

for (const width of [360, 390, 430]) {
  test(`${width}px 首页走查：无角色条、触控区、切换内容与抽屉`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('.hr-roles')).toHaveCount(0)
    const header = await page.locator('.site-header').boundingBox()
    const banner = await page.locator('.home-banner').boundingBox()
    expect(Math.abs(banner!.y - header!.y - header!.height)).toBeLessThan(2)
    const smallTargets = await page
      .locator(
        '.hr-tabs button,.hr-prompts button,.hr-format,.hr-heading a,.hr-footrow button,.hr-source-row,.hr-ranking-note',
      )
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => node.getBoundingClientRect().height < 44)
          .map((node) => node.textContent),
      )
    expect(smallTargets).toEqual([])
    await page.screenshot({ path: `outputs/home-audit/${width}-first.png` })
    for (const tab of ['热门赛事', '套利机会', '滚球动态']) {
      await page.getByRole('button', { name: tab, exact: true }).click()
      await page.locator('section[aria-label="赛事与机会"]').scrollIntoViewIfNeeded()
      const overflow = await page
        .locator('.hr-card')
        .evaluateAll((nodes) => nodes.some((node) => node.scrollWidth > node.clientWidth + 1))
      expect(overflow).toBe(false)
      await page.screenshot({ path: `outputs/home-audit/${width}-${tab}.png` })
    }
    await page.getByRole('button', { name: '赔率竞争力', exact: true }).click()
    await page.locator('.main-content').evaluate((e) => (e.scrollTop = e.scrollHeight))
    await page.screenshot({ path: `outputs/home-audit/${width}-bottom.png` })
    await expect(page.getByRole('link', { name: '搜索平台与赛事', exact: true })).toHaveCount(0)
    await page.getByRole('combobox', { name: '语言', exact: true }).click()
    await expect(page.getByRole('listbox', { name: '语言', exact: true })).toBeVisible()
    await page.screenshot({ path: `outputs/home-audit/${width}-language.png` })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox', { name: '语言', exact: true })).toHaveCount(0)
    await page.goto('/?panel=search')
    const drawer = page.getByRole('dialog')
    await drawer.getByRole('searchbox').fill('平台')
    await expect(drawer.getByRole('link', { name: '平台 A', exact: true })).toBeVisible()
    const bounds = await drawer.boundingBox()
    expect(bounds!.height).toBeLessThanOrEqual(844 * 0.8 + 1)
    await page.screenshot({ path: `outputs/home-audit/${width}-search.png` })
    await drawer.getByRole('button', { name: '收起抽屉', exact: true }).click()
    await expect(drawer).not.toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  })
}

test('自动轮播在切换时落在整页边界，输入及降级仍可用', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-24T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-10-24T00:00:01Z'))
  await page.goto('/')
  await page.clock.runFor(5000)
  const track = page.locator('.home-banner__track')
  expect(
    await track.evaluate((e) =>
      Math.abs(e.scrollLeft / e.clientWidth - Math.round(e.scrollLeft / e.clientWidth)),
    ),
  ).toBeLessThan(0.001)
  await page.clock.resume()
  await page.locator('.ae-app').evaluate((e) => e.setAttribute('data-transparency', 'reduced'))
  const input = page.getByRole('textbox', { name: '输入你的问题', exact: true })
  await input.fill('今晚海港队对山城队，你怎么看？')
  await page.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Aegis AI', exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '输入你的问题', exact: true })).toHaveValue(
    '今晚海港队对山城队，你怎么看？',
  )
  await expect(page.locator('.ac-message')).toHaveCount(0)
})
