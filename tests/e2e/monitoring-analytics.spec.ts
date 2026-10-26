import { test, expect } from '@playwright/test'
import { chooseOption } from './helpers/select'

test('资金范围同时约束流水、统计与分享链接；空范围不伪造统计', async ({ page }) => {
  await page.goto('/monitor?chains=ETH&tokens=ETH&platforms=A&period=7d&view=flows')
  const feed = page
    .locator('.ma-card')
    .filter({ has: page.getByRole('heading', { name: '资金流水', exact: true }) })
  await expect(feed.locator('tbody tr').first()).toBeVisible()
  const cells = await feed
    .locator('tbody tr')
    .evaluateAll((rows) => rows.map((row) => row.children[2]?.textContent?.replace(/\s/g, '')))
  expect(cells.every((text) => text === 'ETHETH')).toBe(true)
  await page.getByRole('button', { name: '分享监测分析' }).click()
  const share = page.getByRole('dialog', { name: '分享监测分析' })
  await expect(share).toBeVisible()
  const link = await share.getByRole('textbox', { name: '分析链接' }).inputValue()
  const query = new URL(link).searchParams
  expect(query.get('chains')).toBe('ETH')
  expect(query.get('tokens')).toBe('ETH')
  expect(query.get('period')).toBe('7d')
  expect(query.get('view')).toBe('flows')
  await share.press('Escape')
  await expect(share).not.toBeVisible()
  await page.getByRole('button', { name: '筛选平台', exact: true }).click()
  const scope = page.getByRole('dialog', { name: '筛选条件', exact: true })
  const multi = scope.getByRole('combobox', { name: '公链', exact: true })
  await multi.click()
  const list = page.getByRole('listbox')
  await expect(list).toHaveAttribute('aria-multiselectable', 'true')
  await page.getByRole('option', { name: 'SOL', exact: true }).click()
  await expect(page.getByRole('option', { name: 'SOL', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(list).toBeVisible()
  await list.press('Escape')
  await expect(multi).toBeFocused()
  await page.goto('/monitor?chains=none')
  await expect(page.getByText('当前范围暂无可统计样本，请调整平台、公链或币种选择。')).toBeVisible()
  await expect(page.locator('.ma-kpis')).toHaveCount(0)
  await page.goto('/monitor?platforms=C')
  await expect(page.getByText('样本不足 · 暂不评分', { exact: true })).toBeVisible()
  await expect(page.locator('.ma-kpis')).toHaveCount(0)
})

test('90/365天、指标模式与四种图形可切换；高级统计有对应字段', async ({ page }) => {
  await page.goto('/monitor?chains=ETH&platforms=A&period=7d')
  await expect(page.locator('.ma-kpis')).toBeVisible()
  const before = await page.locator('.ma-kpis strong').first().textContent()
  const period = page.getByRole('combobox', { name: '存款统计时间范围', exact: true })
  await chooseOption(page, period, '365d')
  await expect(page.locator('.ma-kpis strong').first()).not.toHaveText(before!)
  await chooseOption(page, period, '90d')
  await page.getByRole('button', { name: '出款', exact: true }).click()
  await expect(page.getByRole('heading', { name: '链上出款', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '展开高级统计', exact: true }).click()
  await expect(page.getByRole('button', { name: '新增钱包', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '净流量', exact: true }).click()
  await expect(page.getByRole('button', { name: '交易笔数', exact: true })).toBeVisible()
  for (const kind of ['bar', 'bubble', 'boxes', 'line']) {
    await chooseOption(page, page.getByRole('combobox', { name: '图形', exact: true }), kind)
    if (kind === 'boxes') await expect(page.locator('.ma-boxes')).toBeVisible()
    else await expect(page.getByRole('img', { name: /链上净流量/ })).toBeVisible()
  }
})

test('钱包和并排对比有明细；样本证据抽屉不超80%且可返回', async ({ page }) => {
  await page.goto('/monitor?view=wallets&period=30d')
  await expect(page.getByRole('heading', { name: '平台 × 公链余额', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '新增与回访钱包', exact: true })).toBeVisible()
  const wallet = page
    .locator('.ma-card')
    .filter({ has: page.getByRole('heading', { name: '大额存款地址', exact: true }) })
    .locator('tbody button.ma-address')
    .first()
  await wallet.click()
  const detail = page.getByRole('dialog', { name: '地址活动', exact: true })
  await expect(detail).toBeVisible()
  await detail.locator('summary').click()
  await expect(detail.getByText(/不是实际链上交易/)).toBeVisible()
  expect(
    await detail.evaluate((el) => el.getBoundingClientRect().height / innerHeight),
  ).toBeLessThanOrEqual(0.801)
  await detail.press('Escape')
  await expect(detail).not.toBeVisible()
  await page.locator('.ma-tabs').getByRole('button', { name: '平台对比', exact: true }).click()
  await expect(page.getByRole('heading', { name: '平台综合对比', exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: '展开分链余额', exact: true }).check()
  await expect(page.locator('.ma-table-scroll')).toHaveCount(2)
  await expect(page.getByRole('heading', { name: '最大出款', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '筛选平台', exact: true }).click()
  const filters = page.getByRole('dialog', { name: '筛选条件', exact: true })
  await filters.getByRole('button', { name: '传统平台', exact: true }).click()
  await filters.getByRole('button', { name: /查看 \d+ 个平台/ }).click()
  await expect(page.getByRole('heading', { name: '平台综合对比', exact: true })).toBeVisible()
  // Platform choices stay scoped to the active category rather than mixing datasets.
  await expect(page.getByRole('combobox', { name: '添加对比平台', exact: true })).toBeVisible()
})

test('扩展平台、四条公链与范围抽屉、流水翻页保持一致', async ({ page }) => {
  await page.goto('/monitor')
  await expect(page.locator('.ma-kpis > div').last()).toContainText(/9\s*\/\s*10\s*已选/)
  await expect(page.locator('.research-platform')).toHaveCount(3)
  await page.getByRole('button', { name: '展开全部平台（10）', exact: true }).click()
  await expect(page.locator('.research-platform')).toHaveCount(10)
  await expect(
    page
      .getByRole('article', { name: '平台 G', exact: true })
      .getByText('地区未标注', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '筛选平台', exact: true }).click()
  const scope = page.getByRole('dialog', { name: '筛选条件', exact: true })
  await expect(scope).toBeVisible()
  expect(
    await scope.evaluate((el) => el.getBoundingClientRect().height / innerHeight),
  ).toBeLessThanOrEqual(0.801)
  const chain = scope.getByRole('combobox', { name: '公链', exact: true })
  await scope.getByRole('button', { name: '移除TRON', exact: true }).click()
  await expect(chain).toBeFocused()
  await chain.click()
  await expect(scope.getByRole('option', { name: 'TRON', exact: true })).toBeVisible()
  await expect(scope.getByRole('option', { name: 'Arbitrum', exact: true })).toHaveCount(0)
  await scope.getByRole('option', { name: '清空公链', exact: true }).click()
  await scope.getByRole('option', { name: 'TRON', exact: true }).click()
  await scope.getByRole('listbox').press('Escape')
  await expect(chain).toBeFocused()
  await expect(chain).toContainText('1 条公链')
  await scope.getByRole('button', { name: /查看 \d+ 个平台/ }).click()
  await expect(scope).not.toBeVisible()
  await page.locator('.ma-tabs').getByRole('button', { name: '资金流水', exact: true }).click()
  const feed = page
    .locator('.ma-card')
    .filter({ has: page.getByRole('heading', { name: '资金流水', exact: true }) })
  const first = await feed.locator('tbody tr').first().textContent()
  await feed.getByRole('button', { name: '下一页流水', exact: true }).click()
  await expect(feed.locator('tbody tr').first()).not.toHaveText(first!)
  await expect(feed.getByRole('button', { name: '上一页流水', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '筛选平台', exact: true }).click()
  await scope.getByRole('button', { name: '恢复全部', exact: true }).click()
  await expect(scope.getByRole('combobox', { name: '公链', exact: true })).toContainText('全部公链')
  await scope.getByRole('button', { name: /查看 \d+ 个平台/ }).click()
  await expect(scope).not.toBeVisible()
})
