import { test, expect } from '@playwright/test'
test('等级入口同步当前方案，订阅付款与 VIP 转移独立', async ({ page }) => {
  await page.goto('/me')
  const entry = page.getByRole('link', { name: '订阅与特权', exact: true })
  await expect(entry).toContainText('L1')
  await entry.click()
  await expect(page.locator('.sb-account')).toContainText('L1 轻享')
  await expect(page.locator('.sb-plan')).toHaveCount(3)
  for (const [level, price] of [['L1', '200'], ['L2', '500'], ['L3', '1,000']]) {
    await page.getByRole('button', { name: `订阅 ${level}，前往付款`, exact: true }).click()
    const drawer = page.getByRole('dialog', { name: `${level} · 订阅付款`, exact: true })
    await expect(drawer.locator('.sb-order-price')).toContainText(`¥${price}`)
    await expect(drawer.getByRole('link')).toHaveCount(0)
    await expect(drawer.getByRole('button', { name: '继续至安全收银台', exact: true })).toBeDisabled()
    for (const method of ['微信支付', '支付宝']) {
      await drawer.getByRole('radio', { name: method, exact: true }).check()
      await expect(drawer.locator('.sb-payment-state')).toContainText(method === '微信支付' ? '微信扫码付款' : '支付宝扫码付款')
      await expect(drawer.getByRole('button', { name: '生成付款二维码', exact: true })).toBeDisabled()
    }
    await drawer.getByRole('button', { name: '关闭面板', exact: true }).click()
    await expect(drawer).not.toBeVisible()
    await expect(page.locator('.sb-account')).toContainText('L1 轻享')
  }
  await page.getByRole('button', { name: 'AI 用量', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('暂无积分消耗记录')
  await expect(page.getByRole('dialog')).toContainText('每月 1 日 00:00')
})
for (const width of [360, 390, 430]) test(`${width}px 订阅与付款无横向溢出`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 })
  await page.goto('/me?section=subscription')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: '订阅 L2，前往付款', exact: true }).click()
  const drawer = page.getByRole('dialog')
  expect(await drawer.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true)
  expect(await drawer.evaluate((e) => e.getBoundingClientRect().height <= innerHeight * .8 + 1)).toBe(true)
})
