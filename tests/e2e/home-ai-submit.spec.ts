import { test, expect } from '@playwright/test'
for (const entry of ['input', 'sports', 'funding'] as const) {
  test(`首页 ${entry} 跳到 AI 后直接发送，刷新不重复发送`, async ({ page }) => {
    await page.goto('/')
    let question = ''
    if (entry === 'input') {
      question = '请比较平台 A 和平台 B 的资金表现'
      await page.getByRole('textbox', { name: '输入你的问题', exact: true }).fill(question)
      await page.getByRole('button', { name: '发送问题', exact: true }).click()
    } else if (entry === 'sports') {
      question = '今晚维拉 vs 曼城，怎么看？'
      await page.getByRole('button', { name: `试着问：${question}`, exact: true }).click()
    } else {
      question = '哪家平台出金更稳定？请结合链、金额范围和样本分析。'
      await page.getByRole('button', { name: '哪家出金更稳定？', exact: true }).click()
    }
    await expect(page).toHaveURL(/\/ai\?q=/)
    await expect(page.locator('.ac-user-message')).toHaveCount(1)
    await expect(page.locator('.ac-user-message')).toContainText(question)
    await expect(page.getByRole('textbox', { name: '输入你的问题', exact: true })).toHaveValue('')
    await expect(page.locator('.ac-answer')).toHaveCount(1)
    expect(new URL(page.url()).searchParams.has('submit')).toBe(false)
    await page.reload()
    await expect(page.getByRole('textbox', { name: '输入你的问题', exact: true })).toHaveValue(question)
    await expect(page.locator('.ac-user-message')).toHaveCount(0)
  })
}
test('普通问题链接保留草稿行为', async ({ page }) => {
  const question = '请比较平台 A 和平台 B'
  await page.goto('/ai?q=' + encodeURIComponent(question))
  await expect(page.getByRole('textbox', { name: '输入你的问题', exact: true })).toHaveValue(question)
  await expect(page.locator('.ac-user-message')).toHaveCount(0)
})
