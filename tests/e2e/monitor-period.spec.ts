import { test, expect } from '@playwright/test'
import { analyticsAsOf, analyticsLedger } from '../../src/mocks/monitoring-analytics'
import { day, money } from '../../src/features/monitoring/analytics-model'
import { chooseOption } from './helpers/select'
test('时间筛选联动资金数据、排序与详情，并可恢复默认范围', async ({ page }) => {
  await page.goto('/monitor')
  const period = page.getByRole('combobox', { name: '统计时间范围', exact: true })
  await expect(period).toContainText('近30天')
  await expect(
    page.getByRole('region', { name: '监测范围' }).locator('.research-filter-result'),
  ).toContainText('13')
  await expect(page.locator('.research-list-heading')).not.toContainText('家平台')
  for (const [value, days] of [
    ['24h', 1],
    ['7d', 7],
    ['90d', 90],
    ['365d', 365],
  ] as const) {
    await chooseOption(page, period, value)
    const sum = analyticsLedger
      .filter(
        (t) =>
          t.platform === 'A' &&
          t.direction === 'deposit' &&
          t.time >= analyticsAsOf - days * day &&
          t.time < analyticsAsOf,
      )
      .reduce((n, t) => n + t.usd, 0)
    const card = page.getByRole('article', { name: '平台 A', exact: true })
    await expect(card.locator('.research-metric').first()).toContainText(`${value} 存款额`)
    await expect(card.locator('.research-metric').first().locator('strong')).toHaveText(money(sum))
  }
  await chooseOption(page, period, '7d')
  await chooseOption(page, page.getByRole('combobox', { name: '平台排序', exact: true }), 'deposit')
  await expect(page.getByRole('combobox', { name: '平台排序', exact: true })).toContainText(
    '存款额',
  )
  await page.getByRole('button', { name: '重置筛选', exact: true }).click()
  await expect(period).toContainText('近30天')
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    expect(
      await page.locator('.research-list-heading').evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true)
  }
})
test('筛选结果计数在上方随平台和空范围变化，URL周期可还原', async ({ page }) => {
  await page.goto('/monitor?platforms=A,B&period=90d')
  await expect(page.getByRole('combobox', { name: '统计时间范围', exact: true })).toContainText(
    '近90天',
  )
  await expect(page.locator('.ma-monitor-toolbar .research-filter-result')).toContainText('2')
  await page.goto('/monitor?chains=none')
  await expect(page.locator('.ma-monitor-toolbar .research-filter-result')).toContainText('0')
  await expect(page.locator('.research-platform')).toHaveCount(0)
})
