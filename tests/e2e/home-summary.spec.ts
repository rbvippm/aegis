import { test, expect } from '@playwright/test'
test('六项汇总可查看对应平台、评分、关注及详情，事件笔数与平台数分开', async ({ page }) => {
  await page.goto('/')
  const funding = page.getByRole('region', { name: '平台出金监测' })
  const labels = [
    '大鳄提款',
    '资金异动',
    'S级出金纯净度',
    '盾牌分 ≥ 9',
    '小额中位数 ≤ 3分钟',
    '大额中位数 ≤ 10分钟',
  ]
  for (const label of labels) {
    const entry = funding.getByRole('button', { name: new RegExp(`^查看${label}明细`) })
    const total = Number((await entry.innerText()).match(/\d+(?=\s*[笔家])/u)?.[0])
    await entry.click()
    const drawer = page.getByRole('dialog', { name: `${label} · 平台明细`, exact: true })
    await expect(drawer).toBeVisible()
    const rows = drawer.locator('.hf-result')
    expect(await rows.count()).toBeGreaterThan(0)
    if (label === '大鳄提款' || label === '资金异动') {
      const sum = await rows
        .locator('.hf-result-stat')
        .evaluateAll((nodes) =>
          nodes.reduce((n, e) => n + Number(e.textContent?.match(/^\d+/)?.[0]), 0),
        )
      expect(sum).toBe(total)
    } else expect(await rows.count()).toBe(total)
    for (const row of await rows.all()) {
      await expect(row.locator('.hf-platform-score')).toBeVisible()
      await expect(row.locator('.platform-follow')).toHaveAttribute('aria-pressed', 'false')
      await expect(row.locator('a')).toHaveAttribute('href', /^\/monitor\?platform=/)
    }
    await drawer.getByRole('button', { name: '关闭面板', exact: true }).click()
  }
  await funding.getByRole('button', { name: /^查看S级出金纯净度明细/ }).click()
  const drawer = page.getByRole('dialog', { name: 'S级出金纯净度 · 平台明细', exact: true })
  const initialRows = await drawer.locator('.hf-result').count()
  await drawer.getByRole('button', { name: '关注平台 J · 国际站', exact: true }).click()
  await expect(drawer.locator('.hf-result')).toHaveCount(initialRows)
  await expect(
    drawer.getByRole('button', { name: '取消关注平台 J · 国际站', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await drawer
    .locator('.hf-result')
    .filter({ hasText: '平台 J · 国际站' })
    .getByRole('link', { name: '查看平台详情', exact: true })
    .click()
  await expect(page).toHaveURL(/monitor\?platform=J/)
  await expect(
    page.getByRole('dialog', { name: '平台 J · 国际站 · 详情', exact: true }),
  ).toBeVisible()
})
test('已有关注不缩小首页统一范围，抽屉和汇总在移动端不溢出', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('aegis-platform-follows-v1', JSON.stringify(['A'])),
  )
  await page.goto('/')
  const funding = page.getByRole('region', { name: '平台出金监测' })
  await expect(funding).toContainText('全部平台')
  expect(await funding.locator('.hf-pane').count()).toBeGreaterThan(3)
  await funding.getByRole('button', { name: /^查看大鳄提款明细/ }).click()
  const drawer = page.getByRole('dialog', { name: '大鳄提款 · 平台明细', exact: true })
  await expect(drawer).toContainText('全部平台')
  expect(await drawer.locator('.hf-result').count()).toBeGreaterThan(0)
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await drawer.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true)
    expect(
      await drawer.evaluate((e) => e.getBoundingClientRect().height <= innerHeight * 0.8 + 1),
    ).toBe(true)
  }
})
