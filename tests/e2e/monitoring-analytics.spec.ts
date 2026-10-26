import { test, expect, type Page } from '@playwright/test'
import { chooseOption } from './helpers/select'

async function openAnalysis(page: Page, name = '平台 A') {
  await page.getByRole('button', { name: `${name}全部细项`, exact: true }).click()
  const root = page.getByRole('dialog', { name: `${name} · 详情`, exact: true })
  await root.getByRole('button', { name: '深度分析', exact: true }).click()
  const analysis = page.getByRole('dialog', { name: `${name} · 深度分析`, exact: true })
  await expect(analysis).toBeVisible()
  return { root, analysis }
}

test('监测主页面只保留平台列表、三类范围和排序；空范围不展示旧数据', async ({ page }) => {
  await page.goto('/monitor')
  await expect(page.getByRole('heading', { name: '平台监测对比', exact: true })).toBeVisible()
  for (const name of ['公链', '币种', '平台', '统计时间范围', '平台排序'])
    await expect(page.getByRole('combobox', { name, exact: true })).toBeVisible()
  await expect(page.getByRole('combobox')).toHaveCount(5)
  await expect(page.locator('.ma-chart, .ma-kpis')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '资金流水', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '打开平台对比', exact: true })).toBeVisible()
  const chain = page.getByRole('combobox', { name: '公链', exact: true })
  await chain.click()
  await page.getByRole('option', { name: 'ETH', exact: true }).click()
  await expect(page.getByRole('option', { name: 'ETH', exact: true })).toHaveAttribute(
    'aria-selected',
    'false',
  )
  await page.getByRole('listbox').press('Escape')
  await expect(chain).toContainText('3 条公链')
  await expect(chain).toBeFocused()
  await page.goto('/monitor?chains=none')
  await expect(page.getByText('当前范围暂无可统计样本，请调整平台、公链或币种选择。')).toBeVisible()
  await expect(page.locator('.research-platform')).toHaveCount(0)
  await page.getByRole('button', { name: '重置筛选', exact: true }).click()
  await expect(page.locator('.research-platform')).toHaveCount(10)
  await page.goto('/monitor?platforms=C')
  await expect(page.getByText('样本不足 · 暂不评分', { exact: true })).toBeVisible()
})

test('五种排序使用对应数值，升降序有效且缺失评分保持末尾', async ({ page }) => {
  await page.goto('/monitor?platforms=A,B,C')
  const sort = page.getByRole('combobox', { name: '平台排序', exact: true })
  const first = page.locator('.research-platform h3 > button').first()
  for (const [key, expected] of [
    ['score', '平台 A'],
    ['deposit', '平台 B'],
    ['withdrawal', '平台 B'],
    ['net', '平台 A'],
    ['balance', '平台 B'],
  ]) {
    await chooseOption(page, sort, key!)
    await expect(first).toHaveText(expected!)
    await expect(page.locator('.research-platform').last()).toHaveAttribute('aria-label', '平台 C')
  }
  await chooseOption(page, sort, 'deposit')
  await page.getByRole('button', { name: '切换为升序', exact: true }).click()
  await expect(first).toHaveText('平台 A')
})

test('主筛选约束平台深度分析，查看流水后逐级返回且仅有一个抽屉', async ({ page }) => {
  await page.goto('/monitor?chains=ETH&tokens=ETH&platforms=A&period=7d')
  const { root, analysis } = await openAnalysis(page)
  await analysis.locator('.ma-analysis-group > summary').filter({ hasText: '流水与异动' }).click()
  await analysis.locator('.ma-analysis-group > summary').filter({ hasText: '钱包分析' }).click()
  for (const name of ['资金流水', '新增与回访钱包'])
    await expect(analysis.getByRole('heading', { name, exact: true })).toBeVisible()
  const feed = analysis
    .locator('.ma-card')
    .filter({ has: page.getByRole('heading', { name: '资金流水', exact: true }) })
  const cells = await feed
    .locator('tbody tr')
    .evaluateAll((rows) => rows.map((r) => r.children[2]?.textContent?.replace(/\s/g, '')))
  expect(cells.length).toBeGreaterThan(0)
  expect(cells.every((value) => value === 'ETHETH')).toBe(true)
  const chart = analysis.locator('.ma-chart').first()
  await chooseOption(page, chart.getByRole('combobox', { name: '图形', exact: true }), 'bar')
  await feed.getByRole('button', { name: '查看', exact: true }).first().click()
  const evidence = page.getByRole('dialog', { name: '平台 A · 交易凭据', exact: true })
  await expect(evidence).toBeVisible()
  await expect(page.locator('dialog[open]')).toHaveCount(1)
  await evidence.press('Escape')
  await expect(analysis).toBeVisible()
  await expect(chart.getByRole('combobox', { name: '图形', exact: true })).toContainText('柱状')
  await analysis.press('Escape')
  await expect(root).toBeVisible()
  await expect(root.getByRole('button', { name: '深度分析', exact: true })).toBeFocused()
  await root.press('Escape')
  await expect(page.getByRole('combobox', { name: '公链', exact: true })).toContainText('1 条公链')
})

test('详情内时间、图形和分享保留能力，分析周期不改动主列表', async ({ page }) => {
  await page.goto('/monitor?platforms=A,B')
  const { root, analysis } = await openAnalysis(page)
  const period = analysis.getByRole('combobox', { name: '平台分析时间范围', exact: true })
  await chooseOption(page, period, '365d')
  await chooseOption(page, period, '90d')
  const chart = analysis.locator('.ma-chart').first()
  await chart.getByRole('button', { name: '净流量', exact: true }).click()
  for (const kind of ['bar', 'bubble', 'boxes', 'line'])
    await chooseOption(page, chart.getByRole('combobox', { name: '图形', exact: true }), kind)
  await analysis.getByRole('button', { name: '分享平台分析', exact: true }).click()
  const share = page.getByRole('dialog', { name: '平台 A · 分享分析', exact: true })
  const params = new URL(
    await share.getByRole('textbox', { name: '分析链接', exact: true }).inputValue(),
  ).searchParams
  expect(params.get('platforms')).toBe('A')
  expect(params.get('period')).toBe('90d')
  await expect(page.locator('dialog[open]')).toHaveCount(1)
  await share.getByRole('button', { name: '返回深度分析', exact: true }).click()
  await expect(analysis).toBeVisible()
  await analysis.press('Escape')
  await expect(root).toBeVisible()
  await root.press('Escape')
  await expect(page.getByRole('article', { name: '平台 A', exact: true })).toContainText(
    '30d 存款额',
  )
})

test('右下角对比支持四家和联动滚动，查看平台后返回并保留选择', async ({ page }) => {
  await page.goto('/monitor')
  await page.getByRole('button', { name: '打开平台对比', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: '平台对比', exact: true })
  const picker = drawer.getByRole('combobox', { name: '添加对比平台', exact: true })
  await chooseOption(page, picker, 'J')
  await chooseOption(page, picker, 'D')
  await expect(drawer.locator('.ma-compare-pick')).toHaveCount(4)
  await expect(picker).toBeDisabled()
  await drawer.getByRole('checkbox', { name: '展开分链余额', exact: true }).check()
  const table = drawer.getByRole('region', { name: '平台指标对比表', exact: true })
  await drawer.getByRole('button', { name: '向右查看对比平台', exact: true }).click()
  await expect.poll(() => table.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100)
  const chain = drawer.getByRole('region', { name: '分链余额对比表', exact: true })
  await expect.poll(() => chain.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100)
  await drawer.getByRole('button', { name: '平台 A详细指标', exact: true }).click()
  const root = page.getByRole('dialog', { name: '平台 A · 详情', exact: true })
  await expect(root).toBeVisible()
  await expect(drawer).not.toBeVisible()
  await expect(page.locator('dialog[open]')).toHaveCount(1)
  await root.press('Escape')
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('.ma-compare-pick')).toHaveCount(4)
  await expect(drawer.getByRole('checkbox', { name: '展开分链余额', exact: true })).toBeChecked()
  expect(
    await drawer.evaluate((el) => el.getBoundingClientRect().height / innerHeight),
  ).toBeLessThanOrEqual(0.801)
})

test('详情归组且地址活动、评测口径逐级返回，保留展开和焦点', async ({ page }) => {
  await page.goto('/monitor?platforms=A')
  await page.getByRole('button', { name: '平台 A全部细项', exact: true }).click()
  const root = page.getByRole('dialog', { name: '平台 A · 详情', exact: true })
  await expect(root.getByRole('heading', { name: '资金概览', exact: true })).toBeVisible()
  await expect(root.locator('.research-detail-key-metrics > div')).toHaveCount(4)
  const wallet = root
    .locator('.research-detail-group')
    .filter({ has: page.locator('summary').filter({ hasText: '钱包与链上资产' }) })
  await expect(wallet).not.toHaveAttribute('open', '')
  await wallet.locator(':scope > summary').click()
  await wallet.getByRole('button', { name: '地址清单', exact: true }).click()
  const addresses = page.getByRole('dialog', { name: '平台 A · 地址清单', exact: true })
  const address = addresses.locator('tbody button.ma-address').last()
  await address.click()
  const activity = page.getByRole('dialog', { name: '平台 A · 地址活动', exact: true })
  await expect(activity.getByRole('textbox', { name: '钱包地址', exact: true })).not.toHaveValue(
    /sample:/,
  )
  await expect(activity.getByRole('button', { name: '返回地址清单', exact: true })).toBeVisible()
  await activity.press('Escape')
  await expect(addresses).toBeVisible()
  await expect(address).toBeFocused()
  await expect
    .poll(() => addresses.locator('.ma-evidence-table').evaluate((el) => el.scrollTop))
    .toBeGreaterThan(100)
  await expect(page.locator('dialog[open]')).toHaveCount(1)
  await addresses.press('Escape')
  await expect(root).toBeVisible()
  await expect(wallet).toHaveAttribute('open', '')
  await expect(wallet.getByRole('button', { name: '地址清单', exact: true })).toBeFocused()
  await root.locator('.research-detail-group > summary').filter({ hasText: '出金评测' }).click()
  await root.getByRole('button', { name: '出金安全体检卡', exact: true }).click()
  const safety = page.getByRole('dialog', { name: '平台 A · 出金安全体检卡', exact: true })
  await safety.getByRole('button', { name: '查看评级口径', exact: true }).click()
  const method = page.getByRole('dialog', { name: '平台 A · 评级口径与来源', exact: true })
  await expect(method.getByRole('heading', { name: '盾牌分构成', exact: true })).toBeVisible()
  await method.press('Escape')
  await expect(safety).toBeVisible()
  await safety.getByRole('button', { name: '返回上一级', exact: true }).click()
  await expect(root).toBeVisible()
  await expect(page.locator('dialog[open]')).toHaveCount(1)
})

test('详情在没有匹配资产时显示空态，缺失评测不显示已有等级', async ({ page }) => {
  await page.goto('/monitor?platform=A&platforms=A&chains=TRON&tokens=ETH')
  const root = page.getByRole('dialog', { name: '平台 A · 详情', exact: true })
  await expect(root.getByText('当前范围暂无可统计样本', { exact: true })).toBeVisible()
  await expect(root.locator('.research-detail-funds')).toHaveCount(0)
  await page.goto('/monitor?platform=C&platforms=C')
  const incomplete = page.getByRole('dialog', { name: '平台 C · 详情', exact: true })
  await expect(incomplete.getByText('暂无完整评级', { exact: true })).toBeVisible()
  await incomplete
    .locator('.research-detail-group > summary')
    .filter({ hasText: '出金评测' })
    .click()
  await incomplete.getByRole('button', { name: '出金安全体检卡', exact: true }).click()
  const safety = page.getByRole('dialog', { name: '平台 C · 出金安全体检卡', exact: true })
  await expect(safety.locator('.research-inspection')).toHaveClass(/unknown/)
  await expect(safety).toContainText('待检测')
})
