import { test, expect } from '@playwright/test'
test('关注、首页范围、异常消息深链和返回详情保持联动', async ({ page }) => {
  await page.goto('/monitor')
  const card = page.getByRole('article', { name: '平台 A', exact: true })
  expect(await card.locator('.research-platform-follow').count()).toBe(0)
  expect(
    await card
      .locator('.research-platform__header')
      .getByRole('button', { name: '关注平台 A', exact: true })
      .count(),
  ).toBe(1)
  await card.getByRole('button', { name: '关注平台 A', exact: true }).click()
  await expect(card.getByRole('button', { name: '取消关注平台 A', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.reload()
  await expect(
    page.getByRole('button', { name: '取消关注平台 A', exact: true }).first(),
  ).toBeVisible()
  await page
    .getByRole('navigation', { name: '主导航' })
    .getByRole('link', { name: '首页', exact: true })
    .click()
  const funding = page.getByRole('region', { name: '平台出金监测' })
  await expect(funding).toContainText('全部平台')
  expect(await funding.locator('.hf-pane').count()).toBeGreaterThan(3)
  await expect(funding.getByRole('button', { name: '下一条平台动态' })).toBeEnabled()
  await expect(funding.locator('.hf-summary')).toContainText('小额 ≤3分钟')
  await page.getByRole('link', { name: '消息中心', exact: true }).click()
  const notice = page.locator('.pf-notice').filter({ hasText: '平台 A · 热钱包资金转移' })
  await expect(notice).toHaveCount(1)
  await notice.click()
  const drawer = page.getByRole('dialog', { name: '平台 A · 资金动态', exact: true })
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('.research-activity--selected')).toHaveCount(1)
  await drawer.getByRole('button', { name: '返回上一级', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '平台 A · 详情', exact: true })).toBeVisible()
})
test('无关注时统一卡片展示六项汇总，平台动态轮播与窄屏不溢出', async ({ page }) => {
  await page.goto('/')
  const funding = page.getByRole('region', { name: '平台出金监测' })
  await expect(funding).toContainText('全部平台')
  await expect(funding.locator('.hf-pane')).toHaveCount(20)
  await expect(funding.locator('.hf-dynamic-controls .platform-follow')).toHaveCount(0)
  expect(
    await funding
      .locator('.hf-platform-name')
      .evaluateAll((nodes) => nodes.slice(0, 3).map((n) => n.textContent?.trim())),
  ).toEqual(['平台 B', '传统平台 甲', '传统平台 乙'])
  await funding.getByRole('button', { name: '下一条平台动态', exact: true }).click()
  const activePane = funding.locator('.hf-pane:not([inert])')
  await expect(activePane).toHaveAttribute('aria-label', '传统平台 甲动态')
  const trackBox = await funding.locator('.hf-track').boundingBox()
  await page.mouse.move(trackBox!.x + trackBox!.width - 14, trackBox!.y + 2)
  await page.mouse.down()
  await page.mouse.move(trackBox!.x + 25, trackBox!.y + 2, { steps: 8 })
  await page.mouse.up()
  await expect(activePane).toHaveAttribute('aria-label', '传统平台 乙动态')
  await funding.getByRole('button', { name: '上一条平台动态', exact: true }).click()
  await expect(activePane).toHaveAttribute('aria-label', '传统平台 甲动态')
  await expect(activePane.locator('.hf-feed')).toContainText('大鳄提款')
  await expect(activePane.locator('.hf-event')).toHaveAttribute('aria-label', /大鳄提款/)
  await expect(funding.locator('.hf-summary')).toContainText('大鳄提款')
  await activePane.locator('.hf-event').first().click()
  await expect(page.getByRole('dialog', { name: /传统平台 甲 ·/ })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: '关闭面板', exact: true }).click()
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await funding.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await expect(
    page
      .getByRole('navigation', { name: '主导航' })
      .getByRole('link', { name: '赔率', exact: true }),
  ).toHaveAttribute('href', '/compare')
})
