import { test, expect } from '@playwright/test'

test('体育对比导航、格式与排名', async ({ page }) => {
  await page.goto('/compare')
  await expect(page.getByRole('heading', { name: '体育对比', exact: true })).toBeVisible()
  await expect(page.locator('.ae-dock [aria-current="page"]')).toHaveText('对比')
  await expect(page.locator('.sports-page')).not.toContainText(/演示|快照/)
  await page.getByRole('button', { name: '港盘 HK', exact: true }).click()
  await page.screenshot({ path: 'outputs/sports-implementation/format-390.png' })
  await page.getByRole('button', { name: /马盘 MY 正负水位/ }).click()
  await expect(page.getByRole('button', { name: '马盘 MY', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '平台排名', exact: true }).click()
  await expect(page.getByText('共同样本 128 场').first()).toBeVisible()
  await page.getByRole('button', { name: '最优占比', exact: true }).click()
  await expect(page.getByText('31%', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: /取得最优报价的结果占比/ }).click()
  await expect(page.getByRole('dialog')).toContainText('排名指标说明')
})

test('点击所选报价不被替换，费用未知不输出净收益', async ({ page }) => {
  await page.goto('/compare')
  const match = page.getByRole('article', { name: '北辰队对南岳队', exact: true })
  await match.getByRole('button', { name: '平台 A 主 -3.5 0.90', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('所选报价：平台 A')
  await page.getByRole('button', { name: '保留所选报价并试算' }).click()
  await expect(dialog.locator('.sp-allocation tbody tr').first()).toContainText('平台 A')
  await expect(dialog).toContainText('待核算')
  await page.getByRole('button', { name: '重新核验报价' }).click()
  await expect(dialog.getByRole('status')).toContainText('报价服务尚未接入')
})

test('无关注单禁止试算，同场完整结果可以分配', async ({ page }) => {
  await page.goto('/compare')
  await page.getByRole('button', { name: '识别', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: '填入示例' }).click()
  await dialog.getByRole('button', { name: '识别并核对' }).click()
  await expect(dialog.getByRole('status')).toContainText('不同赛事')
  await expect(dialog.getByRole('button', { name: '校验通过后试算' })).toBeDisabled()
  await page.screenshot({ path: 'outputs/sports-implementation/slip-390.png' })
  await dialog
    .getByRole('textbox', { name: '注单文字' })
    .fill('北辰队胜 @ 2.10 平台 A\n南岳队胜 @ 2.10 平台 B')
  await dialog.getByRole('button', { name: '识别并核对' }).click()
  await dialog.getByRole('button', { name: '查看分配试算' }).click()
  await expect(dialog).toContainText('理论毛收益 50.00 USDT')
  await expect(dialog).toContainText('净收益待核算')
})

test('提醒仅本地保存，完整比价支持增加赛事', async ({ page }) => {
  await page.goto('/compare')
  const match = page.getByRole('article', { name: '北辰队对南岳队', exact: true })
  await match.getByRole('button', { name: '提醒', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await page.screenshot({ path: 'outputs/sports-implementation/alert-390.png' })
  await expect(dialog).toContainText('Telegram')
  await expect(dialog).toContainText('尚未接入')
  await dialog.getByRole('button', { name: '保存提醒设置' }).click()
  await expect(dialog.locator('.sp-feedback')).toContainText('设置已保存在本机')
  await page.keyboard.press('Escape')
  await match.getByRole('button', { name: '完整比价', exact: true }).click()
  await dialog.getByRole('combobox', { name: '添加比价赛事' }).selectOption('harbor-mountain')
  await expect(dialog.getByRole('article')).toHaveCount(2)
  await page.keyboard.press('Escape')
  await page.reload()
  await expect(page.getByRole('button', { name: /提醒设置 1 条/ })).toBeVisible()
})

for (const width of [360, 390, 430])
  test(`${width}px体育页面与面板视觉验收`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/compare')
    await page.waitForTimeout(250)
    await expect(page.locator('.sports-page')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.screenshot({
      path: `outputs/sports-implementation/home-${width}.png`,
      fullPage: true,
    })
    await page.getByRole('button', { name: /^套利机会/ }).click()
    await expect(page.getByText('理论毛收益率').first()).toBeVisible()
    await page.getByRole('button', { name: '查看方案' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.screenshot({ path: `outputs/sports-implementation/plan-${width}.png` })
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: '平台排名', exact: true }).click()
    await page.screenshot({
      path: `outputs/sports-implementation/ranking-${width}.png`,
      fullPage: true,
    })
  })
