import { test, expect } from '@playwright/test'

test('监测排序与公链选择共用下拉和焦点行为', async ({ page }) => {
  await page.goto('/monitor')
  const sort = page.getByRole('combobox', { name: '平台排序', exact: true })
  await sort.click()
  await expect(page.getByRole('option', { name: '盾牌分', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(sort).toContainText('热钱包余额')
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await sort.click()
  await page.keyboard.press('Escape')
  await expect(sort).toBeFocused()
  const chain = page.getByRole('combobox', { name: '公链', exact: true })
  await chain.click()
  await page.getByRole('option', { name: 'ETH', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(chain).toBeFocused()
  await expect(chain).toContainText('3 条公链')
})

for (const path of ['/', '/monitor', '/compare', '/ai', '/me']) {
  test(`${path} 头部消息入口统一打开消息中心`, async ({ page }) => {
    await page.goto(path)
    await page.locator('header').getByRole('link', { name: '消息中心', exact: true }).click()
    await expect(page).toHaveURL(/\/me\?section=messages$/)
    await expect(page.getByRole('heading', { name: '消息中心', exact: true })).toBeVisible()
  })
}

for (const width of [360, 390, 430]) {
  test(`${width}px 下拉浮层与地区卡片布局`, async ({ page }) => {
    await page.setViewportSize({ width, height: 932 })
    await page.goto('/monitor')
    const sort = page.getByRole('combobox', { name: '平台排序', exact: true })
    await sort.scrollIntoViewIfNeeded()
    await sort.click()
    await expect(page.getByRole('listbox')).toBeVisible()
    const menu = await page.getByRole('listbox').boundingBox()
    expect(menu!.x).toBeGreaterThanOrEqual(0)
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/unified-controls/monitor-${width}.png` })
  })
}
