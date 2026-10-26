import { test, expect } from '@playwright/test'

const routes = [
  ['home', '/'],
  ['monitor', '/monitor'],
  ['ai', '/ai'],
  ['compare', '/compare'],
  ['me', '/me'],
  ['subscription', '/me?section=subscription'],
  ['vip', '/me?section=vip'],
  ['agents', '/me?section=agents'],
  ['earnings', '/me?section=earnings'],
  ['messages', '/me?section=messages'],
  ['tickets', '/me?section=tickets'],
  ['follows', '/me?section=follows'],
  ['history', '/me?section=history'],
] as const

for (const width of [360, 390, 430]) {
  test(`${width}px 全页面首屏、页尾与统一阅读字号`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const [name, url] of routes) {
      await page.goto(url)
      await expect(page.locator('#main-content')).toBeVisible()
      await expect(page.locator('.ae-dock')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        name,
      ).toBe(false)
      const small = await page
        .locator(
          '.pw-fixture-meta-copy small,.pw-brand,.sb-proposal,.sb-reset small,.he-field-label,.he-selection,.he-movement small',
        )
        .evaluateAll((nodes) =>
          nodes
            .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12)
            .map((el) => el.className),
        )
      expect(small, `${name} 不用缩小正文或规则说明塞入内容`).toEqual([])
      if (process.env.AEGIS_CAPTURE_UI === '1')
        await page.screenshot({ path: `outputs/ui-audit/regression/${width}-${name}-top.png` })
      await page.locator('#main-content').evaluate((el) => (el.scrollTop = el.scrollHeight))
      if (process.env.AEGIS_CAPTURE_UI === '1')
        await page.screenshot({ path: `outputs/ui-audit/regression/${width}-${name}-bottom.png` })
      const overlap = await page.locator('#main-content').evaluate((el) => {
        const dock = document.querySelector('.ae-dock')!.getBoundingClientRect()
        const main = el.getBoundingClientRect()
        const leaf = [...el.querySelectorAll('button,a,p')].filter((e) => {
          const r = e.getBoundingClientRect()
          const s = getComputedStyle(e)
          return (
            r.height &&
            r.width &&
            s.visibility !== 'hidden' &&
            s.display !== 'none' &&
            r.bottom <= main.bottom &&
            r.top >= main.top &&
            !e.closest('dialog')
          )
        })
        const last = leaf.at(-1)?.getBoundingClientRect()
        return el.scrollHeight > el.clientHeight + 2 && last ? last.bottom > dock.top + 1 : false
      })
      expect(overlap, `${name} 滚到底后末项不被底栏遮挡`).toBe(false)
    }
  })
  test(`${width}px 关键选择态、触控区和宽表局部滚动`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/compare')
    await page.getByRole('button', { name: '玩法与赔率设置 · 港盘 HK', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const selected = dialog.getByRole('button', { name: /港盘 HK/, pressed: true })
    expect(
      await selected.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth)),
    ).toBeGreaterThan(0)
    expect(await selected.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
    const rect = await dialog.boundingBox()
    expect(rect!.height).toBeLessThanOrEqual(844 * 0.8 + 1)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/ui-audit/regression/${width}-format-selected.png` })
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await page.getByRole('button', { name: '足球', exact: true }).click()
    const match = page.locator('.pw-fixture').first()
    await match.getByRole('button', { name: '半全场', exact: true }).click()
    await match.locator('.pw-matrix').scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    const matrix = match.locator('.pw-matrix-scroll')
    expect(await matrix.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/ui-audit/regression/${width}-multi-outcome.png` })
    await match.getByRole('button', { name: /比赛中心/ }).click()
    await dialog.getByRole('button', { name: '近期战绩', exact: true }).click()
    await expect(dialog.locator('.pw-result-row')).toHaveCount(8)
    expect(
      await dialog
        .locator('.pw-result-row small')
        .first()
        .evaluate((el) => getComputedStyle(el).whiteSpace),
    ).toBe('nowrap')
    expect(await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1)).toBe(false)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/ui-audit/regression/${width}-recent-form.png` })
    await page.goto('/me?section=subscription')
    for (const level of ['L1 轻享', 'L2 进阶', 'L3 尊享']) {
      await page.getByRole('tab', { name: level, exact: true }).click()
      await expect(page.getByRole('tabpanel')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
    }
    await page.getByRole('button', { name: '档次对比', exact: true }).click()
    await page.getByRole('region', { name: '订阅权益对比' }).scrollIntoViewIfNeeded()
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/ui-audit/regression/${width}-subscription-table.png` })
    await page.goto('/compare')
    await page.getByRole('button', { name: /^套利机会/ }).click()
    await page.getByRole('button', { name: '查看方案', exact: true }).first().click()
    const result = page.getByRole('dialog').locator('.sp-net-result')
    await result.scrollIntoViewIfNeeded()
    expect(await result.evaluate((el) => getComputedStyle(el).display)).toBe('flex')
    expect(
      await result.locator('b').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(24)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/ui-audit/regression/${width}-net-result.png` })
    await page.goto('/ai')
    const brand = await page.locator('.ac-brand').boundingBox()
    expect(brand!.width).toBeGreaterThanOrEqual(44)
    expect(brand!.height).toBeGreaterThanOrEqual(44)
  })
}

test('桌面居中栏与减少透明度降级', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const [name, url] of routes.slice(0, 8)) {
    await page.goto(url)
    const main = await page.locator('#main-content').boundingBox()
    expect(main!.width).toBeLessThanOrEqual(430)
    expect(Math.abs(main!.x + main!.width / 2 - 720)).toBeLessThan(2)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/ui-audit/regression/desktop-${name}.png` })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/compare')
  await page.locator('.ae-app').evaluate((el) => el.setAttribute('data-transparency', 'reduced'))
  expect(await page.locator('.ae-dock').evaluate((el) => getComputedStyle(el).backdropFilter)).toBe(
    'none',
  )
  if (process.env.AEGIS_CAPTURE_UI === '1')
    await page.screenshot({ path: 'outputs/ui-audit/regression/reduced-transparency.png' })
})
