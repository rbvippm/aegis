import { test, expect } from '@playwright/test'
import { chooseOption } from './helpers/select'
test('返利区保持紧凑，说明弹窗展示统一比例和结算记录', async ({ page }) => {
  await page.goto('/monitor')
  const a = page.locator('#platform-A .rebate-benefit')
  await expect(a).toContainText('15%')
  const bound = a.locator('.rebate-benefit__bind')
  await expect(bound).toHaveClass(/rebate-benefit__bind--bound/)
  const unbound = page.locator('#platform-J .rebate-benefit__bind')
  await expect(unbound).not.toHaveClass(/rebate-benefit__bind--bound/)
  expect(await bound.evaluate((e) => getComputedStyle(e).backgroundImage)).toBe('none')
  expect(await unbound.evaluate((e) => getComputedStyle(e).backgroundImage)).toContain('gradient')
  await expect(a.locator('a')).toHaveCount(0)
  await expect(a).not.toContainText('渠道佣金')
  await a.getByRole('button', { name: '平台 A返利说明', exact: true }).click()
  const info = page.getByRole('dialog', { name: '平台 A · 返利说明', exact: true })
  await expect(info.locator('.rebate-info__formula')).toContainText('渠道佣金')
  await expect(info.locator('.rebate-info__formula')).toContainText('30%')
  await expect(info.locator('.rebate-info__formula')).toContainText('50%')
  expect(await info.locator('.rebate-info__hero > strong').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeLessThanOrEqual(30)
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await info.locator('.rebate-info').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true)
    expect(await info.evaluate((e) => e.getBoundingClientRect().height <= innerHeight * .8 + 1)).toBe(true)
  }
  await expect(info.locator('.rebate-info__totals')).toContainText('2,180.00')
  await expect(info.locator('a')).toHaveCount(0)
  await info.getByRole('button', { name: '关闭面板', exact: true }).click()
  await expect(info).not.toBeVisible()
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await a.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true)
    expect((await a.boundingBox())!.height).toBeLessThanOrEqual(90)
  }
  await a.getByRole('button', { name: '绑定平台 A，了解返利', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: '平台 A · 账户关联', exact: true })
  await expect(drawer.locator('.rebate-benefit')).toContainText('15%')
  await drawer.getByRole('button', { name: '平台 A返利说明', exact: true }).click()
  await expect(info).toBeVisible()
  await info.getByRole('button', { name: '关闭面板', exact: true }).click()
  await expect(drawer).toBeVisible()
})
test('缺失返水展示说明，排序将缺失值置后', async ({ page }) => {
  await page.goto('/monitor')
  await chooseOption(page, page.getByRole('combobox', { name: '平台排序', exact: true }), 'rebate')
  const expand = page.getByRole('button', { name: /展开全部平台/ })
  if (await expand.count()) await expand.click()
  const missing = page.locator('#platform-C .rebate-benefit')
  await expect(missing).toContainText('信息待补充')
  await expect(missing).not.toContainText('返利 0%')
  const ids = await page
    .locator('.research-platform')
    .evaluateAll((nodes) => nodes.map((e) => e.id))
  expect(ids.indexOf('platform-C')).toBeGreaterThan(ids.indexOf('platform-A'))
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await page.locator('#platform-A').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
      true,
    )
  }
})
