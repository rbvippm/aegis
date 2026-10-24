import { test, expect } from '@playwright/test'

test('首页 VIP 入口、条款、双方案对比与排行窗口', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'VIP 服务', exact: true }).click()
  await expect(page.getByRole('heading', { name: '让平台为你提供方案' })).toBeVisible()
  await expect(page).toHaveTitle('VIP 服务 · Aegis')
  await expect(page.locator('.ae-dock [aria-current="page"]')).toHaveText('我的')
  await page.getByRole('button', { name: '平台 B完整 VIP 条款' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('每周上限 1,000 U')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: '加入对比 平台 A', exact: true }).click()
  await page.getByRole('button', { name: '加入对比 平台 B', exact: true }).click()
  await page.getByRole('button', { name: '查看方案对比' }).click()
  await expect(dialog).toContainText('8% / 月')
  await expect(dialog).toContainText('10% / 周')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('combobox', { name: 'VIP 平台筛选' }).selectOption('B')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: '匿名充值榜', exact: true }).click()
  await page.getByRole('button', { name: '近90日', exact: true }).click()
  await expect(page.locator('.svc-rank-list')).toContainText('20–50万 U')
})

test('VIP 匿名需求可编辑与清除，刷新后不保留', async ({ page }) => {
  await page.goto('/me?section=vip')
  await page.getByRole('button', { name: '匿名获取 VIP 报价' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('近 30 日充值区间').selectOption({ label: '1–5万 U' })
  await dialog.getByLabel('当前 VIP 等级').selectOption({ label: 'VIP 4–6' })
  await dialog.getByLabel('最关注的待遇').selectOption({ label: '专属日返水' })
  await dialog.getByRole('button', { name: '保存需求' }).click()
  await expect(dialog.getByRole('status')).toContainText('需求已保存')
  await dialog.getByRole('button', { name: '查看我的需求' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('.svc-request-summary')).toContainText('1–5万 U')
  await page.getByRole('button', { name: '编辑需求' }).click()
  await expect(dialog.getByLabel('当前 VIP 等级')).toHaveValue('VIP 4–6')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: '清除需求' }).click()
  await expect(page.locator('.svc-request-summary')).toContainText('暂无需求')
  await page.reload()
  await page.getByRole('button', { name: '我的需求', exact: true }).click()
  await expect(page.locator('.svc-request-summary')).toContainText('暂无需求')
})

test('代理入口、政策筛选、费用试算和证据说明', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '代理比价', exact: true }).click()
  await expect(page.getByRole('heading', { name: '把佣金规则放到明面' })).toBeVisible()
  await expect(page.locator('.svc-estimate')).toContainText('3,680 U')
  await expect(page.locator('.svc-estimate')).toContainText('3,960 U')
  await page.getByRole('combobox', { name: '代理结算周期' }).selectOption('weekly')
  await expect(page.locator('.svc-policy-table thead')).not.toContainText('平台 B')
  await page.getByRole('combobox', { name: '场馆费筛选' }).selectOption('none')
  await expect(page.getByText('暂无匹配政策')).toBeVisible()
  await page.getByRole('button', { name: '重置筛选' }).click()
  await page.getByRole('button', { name: '自定义试算' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('当期净收益（U）').fill('10000')
  await dialog.locator('fieldset').first().getByLabel('其他扣减（U）').fill('200')
  await dialog.getByRole('button', { name: '计算预计佣金' }).click()
  await expect(dialog.getByRole('status')).toContainText('3,600 U')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: '平台 B代理条款' }).click()
  await expect(dialog).toContainText('负余额跨月带入下一期')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: '平台 A履约与争议证据' }).click()
  await expect(dialog).toContainText('样本不足，暂不评级')
})

test('代理团队需求、规划面板与辅助入口', async ({ page }) => {
  await page.goto('/me?section=agents')
  await page.getByRole('button', { name: /第三方佣金担保/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('不接收任何担保资金')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: '发布匿名合作需求' }).click()
  await dialog.getByLabel('团队月净收益规模').selectOption({ label: '10–20万 U' })
  await dialog.getByLabel('团队规模').selectOption({ label: '11–50 人' })
  await dialog.getByLabel('优先合作条件').selectOption({ label: '不结转负盈利' })
  await dialog.getByRole('button', { name: '保存需求' }).click()
  await dialog.getByRole('button', { name: '查看我的需求' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('.svc-request-summary')).toContainText('不结转负盈利')
  await page
    .locator('.svc-support')
    .getByRole('link', { name: /问 Aegis AI/ })
    .click()
  await expect(page.getByRole('textbox', { name: '输入你的问题' })).toHaveValue(/代理佣金/)
})

for (const width of [360, 390, 430]) {
  test(`${width}px VIP 与代理页面、抽屉无溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const section of ['vip', 'agents']) {
      await page.goto(`/me?section=${section}`)
      await expect(page.locator('.svc-hero h1')).toBeVisible()
      if (width === 390) {
        await expect(page.locator('.page-enter-active')).toHaveCount(0)
        await page.screenshot({
          path: `outputs/services/${section}-390-viewport.png`,
          animations: 'disabled',
        })
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
      await page.locator('.svc-support').scrollIntoViewIfNeeded()
      const support = await page.locator('.svc-support').boundingBox()
      const dock = await page.locator('.ae-dock').boundingBox()
      expect(support!.y + support!.height).toBeLessThanOrEqual(dock!.y)
      await page.locator('.svc-hero .svc-primary').click()
      await expect(page.getByRole('dialog')).toBeVisible()
      expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
        false,
      )
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
    }
    expect(errors).toEqual([])
  })
}

for (const section of ['vip', 'agents']) {
  test(`${section} 完整页面截图与桌面应用宽度`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/me?section=${section}`)
    await expect(page.locator('.svc-hero h1')).toBeVisible()
    await expect(page.locator('.page-enter-active')).toHaveCount(0)
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.setViewportSize({ width: 390, height })
    await expect(page.locator('.ae-dock')).toBeVisible()
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    )
    await page.screenshot({
      path: `outputs/services/${section}-390-full.png`,
      animations: 'disabled',
    })
    await page.setViewportSize({ width: 1280, height: 900 })
    expect((await page.locator('.home-shell').boundingBox())!.width).toBe(430)
  })
}
