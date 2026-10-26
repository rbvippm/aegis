import { test, expect } from '@playwright/test'
import { chooseOption } from './helpers/select'
test('我的页VIP入口只突出服务，普通用户进入独立订阅页', async ({ page }) => {
  await page.goto('/me')
  const vip = page.locator('.pf-vip')
  await expect(vip).toContainText('VIP 服务')
  await expect(vip).toContainText('定制化报价')
  await expect(vip).not.toContainText(/AI|权益|额度/)
  await page.getByRole('link', { name: '订阅与特权', exact: true }).click()
  await expect(page).toHaveURL(/section=subscription/)
  await expect(page.getByRole('heading', { name: '订阅与特权', exact: true })).toBeVisible()
  await expect(page.locator('.sb-account')).toContainText('普通用户')
  await page.getByRole('button', { name: '返回上一级' }).click()
  await expect(page).toHaveURL(/\/me$/)
  await page.getByRole('button', { name: '查看个人资料', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('textbox', { name: '昵称' })).toHaveValue(
    'AE小子',
  )
})
test('订阅方案可切换、键盘选择、深链接与权益对比，不冒充已开通', async ({ page }) => {
  await page.goto('/me?section=subscription')
  await page.getByRole('tab', { name: 'L1 轻享', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toContainText('1,000')
  await expect(page.getByRole('tabpanel')).toContainText('关注赛事提醒')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'L2 进阶', exact: true })).toBeFocused()
  await expect(page.getByRole('tabpanel')).toContainText('5,000')
  await expect(page.getByRole('tabpanel')).toContainText('VIP 转移优先报价')
  await page.getByRole('tab', { name: 'L3 尊享', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toContainText('15,000')
  await expect(page).toHaveURL(/level=L3/)
  await page.reload()
  await expect(page.getByRole('tab', { name: 'L3 尊享', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.locator('.sb-account')).toContainText('普通用户')
  await page.getByRole('button', { name: '档次对比', exact: true }).click()
  const comparison = page.getByRole('region', { name: '订阅权益对比' })
  await expect(comparison.getByRole('columnheader')).toHaveCount(4)
  await expect(comparison).toContainText('团队代理定制方案')
  await expect(comparison).toContainText('每月 1 日 00:00（UTC+8）')
  await page.goto('/me?section=subscription&level=unknown')
  await expect(page.getByRole('tab', { name: 'L2 进阶', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})
test('个人积分展示累计与周期口径，缺账单不生成虚假扣费', async ({ page }) => {
  await page.goto('/me?section=subscription')
  const usage = page.getByRole('region', { name: 'AI 积分用量', exact: true })
  await expect(usage).toContainText('累计消耗总积分')
  await expect(usage).toContainText('本周期已消耗')
  await expect(usage).toContainText('暂无积分消耗记录')
  await expect(usage.locator('strong').first()).toContainText('—')
  await page.getByRole('button', { name: '用量明细' }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toContainText('AI 积分用量明细')
  await expect(drawer).toContainText('每月 1 日 00:00（UTC+8）')
  await expect(drawer).toContainText('下次重置开通订阅后显示')
  await drawer.getByRole('link', { name: '前往 AI 分析', exact: true }).click()
  await expect(page).toHaveURL(/\/ai$/)
})
test('订阅档次传入VIP定制报价，并保存在需求记录中', async ({ page }) => {
  await page.goto('/me?section=subscription&level=L3')
  await page.getByRole('button', { name: '了解 L3 订阅方案', exact: true }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toContainText('15,000 / 月')
  await drawer.getByRole('link', { name: '获取 VIP 定制报价', exact: true }).click()
  await expect(page).toHaveURL(/section=vip&subscription=L3&inquire=1/)
  await expect(drawer).toContainText('L3 订阅方案咨询')
  await chooseOption(page, drawer.getByRole('combobox', { name: '近 30 日充值区间' }), {
    label: '1–5万 U',
  })
  await chooseOption(page, drawer.getByRole('combobox', { name: '当前 VIP 等级' }), {
    label: 'VIP 1–3',
  })
  await chooseOption(page, drawer.getByRole('combobox', { name: '最关注的待遇' }), {
    label: 'VIP 等级匹配',
  })
  await drawer.getByRole('button', { name: '保存需求', exact: true }).click()
  await expect(drawer.getByRole('status')).toContainText('需求已保存')
  await drawer.getByRole('button', { name: '查看我的需求' }).click()
  await expect(page.locator('.svc-request-summary')).toContainText('咨询的订阅方案L3')
  await page.getByRole('navigation').getByRole('link', { name: '我的', exact: true }).click()
  await expect(page.getByRole('link', { name: '订阅与特权', exact: true })).toContainText(
    '普通用户',
  )
})
for (const width of [360, 390, 430])
  test(`${width}px 订阅页面、对比表与咨询抽屉布局`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/me')
    await expect(page.locator('.page-enter-active')).toHaveCount(0)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({
        path: `outputs/subscription/${width}-profile.png`,
        animations: 'disabled',
      })
    await page.getByRole('link', { name: '订阅与特权', exact: true }).click()
    await expect(page.locator('.sb-account')).toBeVisible()
    await page.waitForTimeout(200)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({
        path: `outputs/subscription/${width}-subscription.png`,
        animations: 'disabled',
      })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.getByRole('button', { name: '档次对比', exact: true }).click()
    const comparison = page.getByRole('region', { name: '订阅权益对比' })
    await comparison.scrollIntoViewIfNeeded()
    expect(await comparison.evaluate((el) => el.scrollWidth > el.clientWidth + 1)).toBe(false)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({
        path: `outputs/subscription/${width}-comparison.png`,
        animations: 'disabled',
      })
    await page.getByRole('button', { name: '了解 L2 订阅方案', exact: true }).click()
    await page.waitForTimeout(300)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({
        path: `outputs/subscription/${width}-plan.png`,
        animations: 'disabled',
      })
    expect(
      await page.getByRole('dialog').evaluate((el) => el.scrollWidth > el.clientWidth + 1),
    ).toBe(false)
    await page.keyboard.press('Escape')
    await page.locator('#main-content').evaluate((el) => (el.scrollTop = el.scrollHeight))
    const content = await page.locator('.pf-content').boundingBox(),
      dock = await page.locator('.ae-dock').boundingBox()
    expect(content!.y + content!.height).toBeLessThanOrEqual(dock!.y)
    expect(errors).toEqual([])
  })
