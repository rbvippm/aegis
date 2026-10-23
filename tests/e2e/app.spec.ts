import { test, expect } from '@playwright/test'

test('首页入口进入占位页，导航可返回首页', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /看清平台/ })).toBeVisible()
  await page.getByRole('button', { name: /试着问/ }).click()
  await expect(page.getByRole('heading', { name: 'Aegis AI' })).toBeVisible()
  await expect(page.getByText('页面设计中，敬请期待。')).toBeVisible()
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await page.getByRole('navigation').getByRole('link', { name: '首页', exact: true }).click()
  await expect(page.getByRole('heading', { name: /看清平台/ })).toBeVisible()
})

test('导航页及二级入口仅显示对应占位文案', async ({ page }) => {
  for (const [path, title] of [
    ['/monitor', '监测'],
    ['/ai?q=演示问题', 'Aegis AI'],
    ['/compare', '数据对比'],
    ['/me', '我的'],
    ['/me?section=vip', 'VIP 服务'],
    ['/me?section=agents', '代理比价'],
    ['/compare?tab=funding', '出入金对比'],
  ]) {
    await page.goto(path!)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.getByText('页面设计中，敬请期待。')).toBeVisible()
    await expect(page.locator('.main-content table, .main-content form')).toHaveCount(0)
    await expect(page.locator('.ae-dock [aria-current="page"]')).toHaveCount(1)
  }
})

for (const width of [360, 390, 430]) {
  test(`${width}px 首页与占位页无溢出或脚本错误`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const path of ['/', '/monitor', '/compare', '/me', '/ai']) {
      await page.goto(path)
      await expect(page.locator('h1')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
      await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()
    }
    expect(errors).toEqual([])
  })
}
