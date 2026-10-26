import { test, expect } from '@playwright/test'
test('AI 办理关注具有实际结果，重复执行不反向切换，个人关注同步', async ({ page }) => {
  await page.goto('/ai?analyze=1&q=' + encodeURIComponent('帮我关注平台 A，接收异常消息'))
  const tasks = page.getByRole('region', { name: '可办理事项' })
  await expect(tasks).toBeVisible()
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('aegis-platform-follows-v1') ?? '[]'),
    ),
  ).toEqual([])
  await tasks.getByRole('button', { name: '关注平台 A', exact: true }).click()
  await expect(tasks.getByRole('status')).toContainText('已关注平台 A')
  await tasks.getByRole('button', { name: '关注平台 A', exact: true }).click()
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('aegis-platform-follows-v1') ?? '[]'),
    ),
  ).toEqual(['A'])
  await page.getByRole('link', { name: '查看我的平台关注', exact: true }).click()
  await expect(page.getByRole('button', { name: '取消关注平台 A', exact: true })).toBeVisible()
  await page.goto('/ai?analyze=1&q=' + encodeURIComponent('帮我把平台异常消息标为已读'))
  await page.getByRole('button', { name: '将平台消息标为已读', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('平台消息标为已读')
  await page.getByRole('link', { name: '打开消息中心', exact: true }).click()
  expect(
    await page.locator('.pf-notice--unread').filter({ hasText: '热钱包资金转移' }).count(),
  ).toBe(0)
})
test('快捷问题、资金数据、来源和邀请海报入口可演示', async ({ page }) => {
  await page.goto('/ai')
  await expect(page.getByRole('heading', { name: '你好，我是 Aegis AI', exact: true })).toBeVisible()
  for (let i = 0; i < 11 && !(await page.getByRole('button', { name: '平台 A 近30天的存款、出款和净流量是多少？', exact: true }).count()); i++)
    await page.getByRole('button', { name: '换一批推荐问题', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '平台 A 近30天的存款、出款和净流量是多少？', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: '平台 A 近30天的存款、出款和净流量是多少？', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: '平台 A · 资金分析', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: '同窗口资金指标' })).toContainText('$879.65K')
  await page.getByRole('button', { name: '来源与更新时间', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('固定资金快照')
  await page.getByRole('dialog').getByRole('button', { name: '关闭面板', exact: true }).click()
  await page.goto(
    '/ai?analyze=1&q=' + encodeURIComponent('帮我邀请好友，并分享到 WhatsApp 或 Telegram'),
  )
  await page.getByRole('link', { name: '准备我的专属邀请海报', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '邀请好友', exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: /Aegis 专属邀请海报/ })).toBeVisible()
})
