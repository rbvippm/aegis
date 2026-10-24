import { test, expect } from '@playwright/test'

test('从首页进入消息中心，返回首页且可再次进入', async ({ page }) => {
  await page.goto('/')
  for (let i = 0; i < 2; i++) {
    await page.getByRole('link', { name: '消息中心', exact: true }).click()
    await expect(page).toHaveURL(/\/me\?section=messages$/)
    await page.getByRole('button', { name: '返回上一级', exact: true }).click()
    await expect(page).toHaveURL(/6173\/$/)
    await expect(
      page.getByRole('heading', { name: '看清平台，再做选择', exact: true }),
    ).toBeVisible()
  }
})

test('从我的和工单进入消息，分别返回真实上一级', async ({ page }) => {
  await page.goto('/me')
  await page.getByRole('button', { name: '消息中心', exact: true }).click()
  await page.getByRole('button', { name: '返回上一级', exact: true }).click()
  await expect(page).toHaveURL(/\/me$/)
  await page.getByRole('button', { name: /我的工单/ }).click()
  await expect(page).toHaveURL(/section=tickets/)
  await page.getByRole('button', { name: '工单通知', exact: true }).click()
  await page.getByRole('button', { name: '返回上一级', exact: true }).click()
  await expect(page).toHaveURL(/section=tickets/)
})

test('消息页刷新仍保留返回来源，直接打开无来源则回我的', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '消息中心', exact: true }).click()
  await expect(page).toHaveURL(/\/me\?section=messages$/)
  await page.reload()
  await page.getByRole('button', { name: '返回上一级', exact: true }).click()
  await expect(page).toHaveURL(/6173\/$/)
  const direct = await page.context().newPage()
  await direct.goto('/me?section=messages')
  await direct.getByRole('button', { name: '返回上一级', exact: true }).click()
  await expect(direct).toHaveURL(/\/me$/)
  await direct.close()
})
