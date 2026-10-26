import { test, expect } from '@playwright/test'
test('欢迎页一屏展示，换一批循环访问全部问题并保留问答入口', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 793 })
  await page.goto('/ai')
  await expect(page.locator('.ac-demo-groups')).toHaveCount(0)
  const first = await page.locator('.ac-suggestions button').allTextContents()
  const seen = new Set(first.map((text) => text.trim()))
  for (let i = 0; i < 8; i++) {
    await page.getByRole('button', { name: '换一批推荐问题', exact: true }).click()
    for (const text of await page.locator('.ac-suggestions button').allTextContents()) seen.add(text.trim())
  }
  expect(seen.size).toBe(22)
  expect(await page.locator('.ac-suggestions button').allTextContents()).toEqual(first)
  for (const [width, height] of [[360, 640], [390, 793], [430, 932]]) {
    await page.setViewportSize({ width: width!, height: height! })
    await expect(page.locator('.ac-suggestions button')).toHaveCount(height! <= 700 ? 2 : 3)
    expect(await page.locator('.ac-thread').evaluate((e) => e.scrollHeight <= e.clientHeight + 1)).toBe(true)
    const composer = await page.locator('.ac-composer-area').boundingBox(), dock = await page.locator('.ae-dock').boundingBox()
    expect(composer!.y + composer!.height).toBeLessThanOrEqual(dock!.y)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('button', { name: '换一批推荐问题', exact: true }).click()
  await page.getByRole('button', { name: '海港队对山城队，主队 -0.5 哪家有效报价更值得核验？', exact: true }).click()
  await expect(page.getByRole('heading', { name: '海港队 vs 山城队', exact: true })).toBeVisible()
})
