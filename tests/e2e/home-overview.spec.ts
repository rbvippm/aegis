import { test, expect } from '@playwright/test'

test('首页保留重要模块，移除两个指定区块', async ({ page }) => {
  await page.goto('/')
  for (const name of ['赛事与机会', '平台资金监测', '平台榜单'])
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  for (const name of ['专属服务', '我的工作台'])
    await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'VIP 服务', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '代理比价', exact: true })).toBeVisible()
  await expect(page.getByText('$67.4M', { exact: true })).toBeVisible()
  await expect(page.locator('.hr-rank-value').first()).toContainText('9.2')
})

test('首页报价、机会和榜单带入对应对比功能', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '平台 B主队报价详情', exact: true }).click()
  await expect(page).toHaveURL(/match=harbor-mountain/)
  await expect(page.getByRole('dialog')).toContainText('平台 B')
  await page.goto('/')
  await page.getByRole('button', { name: '套利机会', exact: true }).click()
  await expect(page.getByText('发现理论价差', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: '查看分配试算', exact: false }).click()
  await expect(page.getByRole('dialog')).toContainText('机会核验')
  await expect(page.getByRole('dialog')).toContainText('北辰队')
  await page.goto('/')
  await page.getByRole('button', { name: '赔率竞争力', exact: true }).click()
  await page.getByRole('link', { name: '完整榜单', exact: false }).click()
  await expect(page.getByRole('button', { name: '平台排名', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('制式偏好、滚球记录、资金抽屉与搜索', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '港盘 HK', exact: true }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByRole('button', { name: '马盘 MY', exact: true }).click()
  await drawer.getByRole('button', { name: '收起抽屉', exact: true }).click()
  await expect(drawer).not.toBeVisible()
  await expect(page.getByRole('button', { name: '马盘 MY', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '滚球动态', exact: true }).click()
  await expect(page.getByText('原记录 · 港盘 HK')).toBeVisible()
  await page.getByRole('button', { name: /平台 B热钱包净流出/ }).click()
  await expect(drawer).toContainText('净流向 −$6.0M')
  await drawer.getByRole('button', { name: '收起抽屉', exact: true }).click()
  await expect(drawer).not.toBeVisible()
  await page.goto('/?panel=search')
  await drawer.getByRole('searchbox').fill('不存在')
  await expect(drawer.getByText('暂无匹配结果')).toBeVisible()
  await drawer.getByRole('searchbox').fill('海港')
  await drawer.getByRole('link', { name: /海港队 vs 山城队/ }).click()
  await expect(page).toHaveURL(/match=harbor-mountain/)
  await expect(page.getByRole('button', { name: '足球', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('帮助、反馈与关于深链接打开个人中心抽屉', async ({ page }) => {
  for (const [label, title] of [
    ['意见反馈', '意见反馈'],
    ['关于我们', '关于我们'],
    ['帮助与客服', '帮助与客服'],
  ]) {
    await page.goto('/')
    await page.getByRole('link', { name: label, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText(title!)
  }
})
for (const width of [360, 390, 430])
  test(`${width}px 首页布局与页尾不被底栏遮挡`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.screenshot({ path: `outputs/home-implementation/home-${width}.png` })
    await page.locator('.main-content').evaluate((e) => (e.scrollTop = e.scrollHeight))
    const bottom = await page.locator('.hr-support').boundingBox(),
      dock = await page.locator('.ae-dock').boundingBox()
    expect(bottom!.y + bottom!.height).toBeLessThanOrEqual(dock!.y)
    await page.screenshot({ path: `outputs/home-implementation/bottom-${width}.png` })
    expect(errors).toEqual([])
  })
