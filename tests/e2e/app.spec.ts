import { chooseOption } from './helpers/select'
import { test, expect } from '@playwright/test'

test('首页问题带入 AI，导航可返回首页', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /看清平台/ })).toBeVisible()
  await page.getByRole('button', { name: /试着问/ }).click()
  await expect(page.getByRole('heading', { name: 'Aegis AI', exact: true })).toBeVisible()
  await expect(page.locator('.ac-user-message')).toContainText('今晚维拉 vs 曼城，怎么看？')
  await expect(page.getByRole('list', { name: '对话消息' })).toHaveCount(0)
  await page.getByRole('navigation').getByRole('link', { name: '首页', exact: true }).click()
  await expect(page.getByRole('heading', { name: /看清平台/ })).toBeVisible()
})

test('我的导航进入个人中心', async ({ page }) => {
  await page.goto('/me')
  await expect(page.getByRole('heading', { name: '我的', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '意见反馈', exact: true })).toBeVisible()
  await expect(page.locator('.ae-dock [aria-current="page"]')).toHaveText('我的')
  await expect(page.getByText('页面设计中，敬请期待。')).toHaveCount(0)
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

test('监测承载平台研究，体育对比保持独立', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /全部平台/ }).click()
  await expect(page).toHaveURL(/\/monitor$/)
  await expect(page.getByRole('heading', { name: '平台监测对比' })).toBeVisible()
  await expect(page.locator('.ae-dock [aria-current="page"]')).toHaveText('监测')
  await page.getByRole('navigation').getByRole('link', { name: '对比', exact: true }).click()
  await expect(page.getByRole('heading', { name: '体育对比', exact: true })).toBeVisible()
  await expect(page.locator('.research-platform')).toHaveCount(0)
})

test('监测主筛选、排序和详情返回', async ({ page }) => {
  await page.goto('/monitor?platforms=A,B')
  await expect(page.locator('.research-platform')).toHaveCount(2)
  await chooseOption(page, page.getByRole('combobox', { name: '平台排序', exact: true }), 'deposit')
  await expect(page.locator('.research-platform').first()).toHaveAttribute('aria-label', '平台 B')
  await page.getByRole('button', { name: '平台 A全部细项', exact: true }).click()
  const root = page.getByRole('dialog', { name: '平台 A · 详情', exact: true })
  await root.locator('.research-detail-group > summary').filter({ hasText: '出金评测' }).click()
  await root.getByRole('button', { name: '出金安全体检卡', exact: true }).click()
  const safety = page.getByRole('dialog', { name: '平台 A · 出金安全体检卡', exact: true })
  await expect(safety).toContainText('污染占比 0.3%')
  await safety.press('Escape')
  await expect(root).toBeVisible()
  await root.press('Escape')
  await expect(root).not.toBeVisible()
  await expect(page.locator('.research-platform').first()).toHaveAttribute('aria-label', '平台 B')
})

test('旧资金入口转向监测，平台详情不进入体育对比', async ({ page }) => {
  await page.goto('/compare?tab=funding')
  await expect(page).toHaveURL(/\/monitor$/)
  await page.goto('/')
  await page.getByRole('link', { name: /平台 A/ }).click()
  await expect(page).toHaveURL(/\/monitor\?platform=A$/)
  await expect(page.getByRole('dialog')).toContainText('盾牌分')
})
