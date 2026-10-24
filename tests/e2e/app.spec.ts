import { test, expect } from '@playwright/test'

test('首页问题带入 AI，导航可返回首页', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /看清平台/ })).toBeVisible()
  await page.getByRole('button', { name: /试着问/ }).click()
  await expect(page.getByRole('heading', { name: 'Aegis AI', exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '输入你的问题' })).toHaveValue(/海港/)
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
  await expect(page.getByRole('heading', { name: '平台综合对比' })).toBeVisible()
  await expect(page.locator('.ae-dock [aria-current="page"]')).toHaveText('监测')
  await page.getByRole('navigation').getByRole('link', { name: '对比', exact: true }).click()
  await expect(page.getByRole('heading', { name: '体育对比', exact: true })).toBeVisible()
  await expect(page.locator('.research-platform')).toHaveCount(0)
})

test('监测筛选、时间切换与详情弹窗', async ({ page }) => {
  await page.goto('/monitor')
  await expect(page.getByRole('article')).toHaveCount(3)
  await page.getByRole('button', { name: '7d', exact: true }).click()
  await expect(page.getByRole('article', { name: '平台 A', exact: true })).toContainText('$548M')
  await page.getByRole('combobox', { name: '平台覆盖公链' }).selectOption('TON')
  await expect(page.getByRole('article')).toHaveCount(2)
  await page.getByRole('searchbox', { name: '搜索平台名称' }).fill('不存在')
  await expect(page.getByText('暂无匹配平台')).toBeVisible()
  await page.getByRole('button', { name: '重置筛选' }).click()
  await page.getByRole('button', { name: '平台 A出金安全体检卡' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('污染占比 0.3%')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: '绑定平台 A UID' }).click()
  await dialog.getByRole('textbox').fill('demo_123')
  await dialog.getByRole('button', { name: '演示校验' }).click()
  await expect(dialog.getByRole('status')).toContainText('未提交或保存 UID')
  await dialog.getByRole('button', { name: '关闭弹窗' }).click()
  await page.getByRole('button', { name: '筛选平台' }).click()
  await dialog.getByLabel('纯净度').selectOption('B')
  await dialog.getByRole('button', { name: '查看 1 个平台' }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article')).toContainText('平台 B')
})

test('旧资金入口转向监测，平台详情不进入体育对比', async ({ page }) => {
  await page.goto('/compare?tab=funding')
  await expect(page).toHaveURL(/\/monitor$/)
  await page.goto('/')
  await page.getByRole('link', { name: /平台 A/ }).click()
  await expect(page).toHaveURL(/\/monitor\?platform=A$/)
  await expect(page.getByRole('dialog')).toContainText('平台 A为虚构演示平台')
})
