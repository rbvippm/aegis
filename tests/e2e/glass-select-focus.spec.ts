import { test, expect } from '@playwright/test'

for (const width of [360, 390, 430]) {
  test(`${width}px 联赛与平台下拉打开不聚焦搜索框，点击后可搜索`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/compare')
    for (const [label, query] of [
      ['联赛', '亚洲'],
      ['平台', 'Stake'],
    ] as const) {
      await page.getByRole('combobox', { name: label, exact: true }).click()
      const menu = page.getByRole('listbox', { name: label, exact: true })
      const input = menu.getByRole('searchbox', { name: `搜索${label}`, exact: true })
      await expect(menu).toBeFocused()
      await expect(input).not.toBeFocused()
      if (process.env.AEGIS_CAPTURE_UI === '1')
        await page.screenshot({
          path: `outputs/select-focus/first-round/${width}-${label}-opened.png`,
        })
      await input.click()
      await expect(input).toBeFocused()
      await input.fill(query)
      await expect(menu.getByRole('option')).not.toHaveCount(0)
      await menu.getByRole('option').first().click()
      await expect(menu).not.toBeVisible()
      await expect(page.getByRole('combobox', { name: label, exact: true })).toContainText(query)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  })
}

test('键盘主动进入搜索，方向键选择和关闭仍然可用', async ({ page }) => {
  await page.goto('/compare')
  const trigger = page.getByRole('combobox', { name: '联赛', exact: true })
  await trigger.focus()
  await trigger.press('ArrowDown')
  const menu = page.getByRole('listbox', { name: '联赛', exact: true })
  await expect(menu).toBeFocused()
  await page.keyboard.press('Tab')
  const input = menu.getByRole('searchbox', { name: '搜索联赛', exact: true })
  await expect(input).toBeFocused()
  await input.fill('欧洲')
  await input.press('ArrowDown')
  await expect(menu).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(trigger).toContainText('欧洲')
  await trigger.click()
  await expect(menu.getByRole('searchbox')).toHaveValue('')
  await page.keyboard.press('Escape')
  await expect(menu).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('抽屉中的可搜索选择也不自动唤起输入焦点', async ({ page }) => {
  await page.goto('/compare')
  await page
    .locator('.pw-fixture')
    .first()
    .getByRole('button', { name: '完整比价', exact: true })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('combobox', { name: '添加比价赛事', exact: true }).click()
  const menu = dialog.getByRole('listbox', { name: '添加比价赛事', exact: true })
  await expect(menu).toBeFocused()
  await expect(menu.getByRole('searchbox')).not.toBeFocused()
  await menu.getByRole('searchbox').click()
  await expect(menu.getByRole('searchbox')).toBeFocused()
  if (process.env.AEGIS_CAPTURE_UI === '1')
    await page.screenshot({ path: 'outputs/select-focus/first-round/drawer-manual-search.png' })
  await page.keyboard.press('Escape')
  await expect(menu).not.toBeVisible()
  await expect(dialog).toBeVisible()
})
