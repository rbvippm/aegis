import { test, expect } from '@playwright/test'
const names = [
  '绑定平台',
  '我的关注',
  'AI 记录',
  '我的工单',
  '邀请好友',
  '代理服务',
  '账户与隐私',
  '联系客服',
]
for (const width of [360, 390, 430]) {
  test(`${width}px个人中心八宫格保留徽标和剩余列表`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/me')
    const grid = page.getByRole('group', { name: '个人中心快捷入口' })
    const cells = grid.locator(':scope > button,:scope > a')
    await expect(cells).toHaveCount(8)
    const labels = await cells.allTextContents()
    names.forEach((name, i) => expect(labels[i]).toContain(name))
    const positions = await cells.evaluateAll((nodes) =>
      nodes.map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height }
      }),
    )
    expect(new Set(positions.slice(0, 4).map((p) => p.y)).size).toBe(1)
    expect(new Set(positions.slice(4).map((p) => p.y)).size).toBe(1)
    expect(positions[4]!.y).toBeGreaterThan(positions[0]!.y)
    expect(positions.every((p) => p.width >= 44 && p.height >= 44)).toBe(true)
    await expect(grid.locator('i')).toHaveCount(2)
    await expect(page.locator('.pf-menu').getByRole('button')).toHaveText(['意见反馈', '关于我们'])
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await grid.scrollIntoViewIfNeeded()
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/profile-grid/${width}-grid.png` })
    await page.locator('#main-content').evaluate((el) => (el.scrollTop = el.scrollHeight))
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/profile-grid/${width}-bottom.png` })
  })
}
test('快捷入口保留路由弹框，联系客服在新窗口打开', async ({ page }) => {
  for (const [name, target] of [
    ['绑定平台', 'earnings'],
    ['我的关注', 'follows'],
    ['AI 记录', 'history'],
    ['我的工单', 'tickets'],
    ['代理服务', 'agents'],
  ]) {
    await page.goto('/me')
    const grid = page.getByRole('group', { name: '个人中心快捷入口' })
    await grid
      .getByRole(name === '代理服务' ? 'link' : 'button', { name: new RegExp(name!) })
      .click()
    await expect(page).toHaveURL(new RegExp(`section=${target}`))
  }
  for (const [name, title] of [
    ['邀请好友', '邀请好友'],
    ['账户与隐私', '账户与隐私'],
  ]) {
    await page.goto('/me')
    await page
      .getByRole('group', { name: '个人中心快捷入口' })
      .getByRole('button', { name: new RegExp(name!) })
      .click()
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: title!, exact: true, level: 2 }),
    ).toBeVisible()
  }
  await page.goto('/me')
  const support = page.getByRole('link', { name: '联系客服', exact: true })
  await expect(support).toHaveAttribute('href', 'https://www.google.com/')
  await expect(support).toHaveAttribute('target', '_blank')
})
