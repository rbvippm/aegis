import { test, expect } from '@playwright/test'
import { chooseOption } from './helpers/select'

test('个人页 Telegram 和邮箱复用设置中的对应弹框', async ({ page }) => {
  await page.goto('/me')
  await page
    .locator('.pf-connections')
    .getByRole('button', { name: 'Telegram', exact: true })
    .click()
  const d = page.getByRole('dialog')
  await expect(d).toContainText('Telegram 登录')
  await expect(page.locator('.ae-drawer[open]')).toHaveCount(1)
  const telegram = await d.locator('.pf-drawer-content').innerText()
  if (process.env.AEGIS_CAPTURE_UI === '1')
    await page.screenshot({ path: 'outputs/compact-comparison/second-round/telegram.png' })
  await page.keyboard.press('Escape')
  await expect(d).not.toBeVisible()
  await page.getByRole('button', { name: '账户设置', exact: true }).click()
  await d.getByRole('button', { name: /Telegram/ }).click()
  await expect(d.locator('.pf-drawer-content')).toHaveText(telegram, { useInnerText: true })
  await page.keyboard.press('Escape')
  await expect(d).not.toBeVisible()
  await page.locator('.pf-connections').getByRole('button', { name: '邮箱', exact: true }).click()
  await expect(d.getByRole('textbox', { name: '邮箱', exact: true })).toBeVisible()
  if (process.env.AEGIS_CAPTURE_UI === '1')
    await page.screenshot({ path: 'outputs/compact-comparison/second-round/email.png' })
  await d.getByRole('textbox', { name: '邮箱', exact: true }).fill('name@example.com')
  await d.getByRole('button', { name: '校验邮箱格式', exact: true }).click()
  await expect(d.getByRole('status')).toContainText('格式')
  await expect(page).toHaveURL(/\/me$/)
})

for (const width of [360, 390, 430]) {
  test(`${width}px 紧凑赛事卡、盘口切换与移除平台分`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/compare')
    const card = page.locator('.pw-fixture').first()
    const bounds = await card.boundingBox()
    expect(bounds!.height).toBeLessThanOrEqual(640)
    const table = await card.locator('.pw-matrix').boundingBox()
    expect(table!.y).toBeLessThan(650)
    await expect(card).not.toContainText('平台分')
    await expect(card.locator('.pw-score')).toHaveCount(0)
    await expect(card.getByRole('combobox', { name: '北辰队盘口线' })).toBeVisible()
    await card.getByRole('button', { name: '上半场', exact: true }).click()
    await expect(card.getByRole('button', { name: '上半场', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await chooseOption(page, card.getByRole('combobox', { name: '北辰队盘口线' }), 'handicap')
    await expect(card.getByRole('button', { name: '全场', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await card.getByRole('button', { name: '结算规则', exact: true }).click()
    await expect(page.getByRole('dialog')).toContainText('玩法规则')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/compact-comparison/second-round/${width}-top.png` })
    await card.evaluate((el) => (el.closest('main')!.scrollTop = (el as HTMLElement).offsetTop))
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/compact-comparison/second-round/${width}-card.png` })
    await chooseOption(
      page,
      page.getByRole('combobox', { name: '平台类型', exact: true }),
      'crypto',
    )
    await expect(card).toContainText('Stake')
    await expect(card).not.toContainText('平台分')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.getByRole('button', { name: '平台排名', exact: true }).click()
    await expect(page.locator('.pw-ranking')).not.toContainText('平台分')
  })
}
