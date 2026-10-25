import { test, expect } from '@playwright/test'
import { chooseOption } from './helpers/select'

test('监测下拉浮层、地区标签与筛选保持同步', async ({ page }) => {
  await page.goto('/monitor')
  const sort = page.getByRole('combobox', { name: '平台排序', exact: true })
  await sort.click()
  await expect(page.getByRole('listbox', { name: '平台排序' })).toBeVisible()
  await expect(page.getByRole('option', { name: '盾牌分' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(sort).toContainText('真实存款')
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await sort.click()
  await page.keyboard.press('Escape')
  await expect(sort).toBeFocused()
  await expect(page.getByRole('article', { name: '平台 A', exact: true })).toContainText('亚洲平台')
  await expect(page.getByRole('article', { name: '平台 B', exact: true })).toContainText('欧洲平台')
  await chooseOption(page, page.getByRole('combobox', { name: '平台地区', exact: true }), 'europe')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: '平台 B详情', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('heading')).toContainText('欧洲平台')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '筛选平台', exact: true }).click()
  const drawer = page.getByRole('dialog')
  await chooseOption(page, drawer.getByRole('combobox', { name: '平台地区', exact: true }), 'asia')
  await drawer.getByRole('combobox', { name: '纯净度', exact: true }).click()
  const list = page.getByRole('listbox', { name: '纯净度', exact: true })
  await expect(list).toBeVisible()
  const bounds = await list.boundingBox()
  const sheet = await drawer.boundingBox()
  expect(bounds!.y).toBeGreaterThanOrEqual(sheet!.y)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(sheet!.y + sheet!.height)
  await page.keyboard.press('Escape')
  await expect(drawer).toBeVisible()
  await drawer.getByRole('button', { name: '查看 2 个平台', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  await sort.click()
  await page.getByRole('heading', { name: '实时追踪', exact: true }).click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
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
    await page.screenshot({ path: `outputs/unified-controls/monitor-${width}.png` })
  })
}
