import { test, expect } from '@playwright/test'
const cases = [
  ['今晚海港队对山城队，你怎么看？', '海港队 vs 山城队'],
  ['北辰队对南岳队，同盘口报价怎么比较？', '北辰队 vs 南岳队'],
  ['帮我分析套利机会与预算分配', '平台价差与预算分配'],
  ['帮我解读滚球盘口与水位变化', '滚球盘口与水位变化'],
  ['哪家平台出金更稳定？', '平台出入金与风险解读'],
  ['比较 VIP 方案时，应该核对哪些条款？', 'VIP 待遇与条款对比'],
  ['比较代理佣金时，应该核对哪些扣费与结算条款？', '代理佣金与扣减解读'],
  ['帮我整理出金进度咨询的事实和材料，不要自动提交', '出金咨询与工单材料整理'],
  ['如何核对平台UID、奖励资格和出金记录？', 'UID、奖励资格与记录核对'],
]
for (const [question, title] of cases)
  test(`AI 项目分析：${title}`, async ({ page }) => {
    await page.goto('/ai?analyze=1&q=' + encodeURIComponent(question!))
    await expect(page.getByRole('heading', { name: title!, exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: '内部推荐方案', exact: true })).toBeVisible()
    await expect(page.locator('.ac-message')).toHaveCount(1)
    await page.getByRole('button', { name: '完整分析与依据', exact: true }).click()
    await expect(page.getByRole('dialog')).toContainText('来源与数据')
    await expect(page.getByRole('dialog')).toContainText('mock')
    await page.getByRole('dialog').getByRole('button', { name: '收起抽屉', exact: true }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    if (title === '北辰队 vs 南岳队') {
      await page.getByRole('button', { name: '为什么过期报价不能参与排名？', exact: true }).click()
      await expect(page.locator('.ac-project-intro').last()).toContainText('北辰队 vs 南岳队')
    }
  })

test('从首页、VIP、代理和工单入口直接进入相应分析', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '让 AI 解读 →', exact: true }).click()
  await expect(page.getByRole('heading', { name: '海港队 vs 山城队', exact: true })).toBeVisible()
  for (const [path, link, title] of [
    ['/me?section=vip', '问 Aegis AI', 'VIP 待遇与条款对比'],
    ['/me?section=agents', '问 Aegis AI', '代理佣金与扣减解读'],
    ['/me?section=tickets', '让 AI 帮我整理事实', '出金咨询与工单材料整理'],
  ]) {
    await page.goto(path!)
    await page.getByRole('link', { name: new RegExp(link!) }).click()
    await expect(page.getByRole('heading', { name: title!, exact: true })).toBeVisible()
  }
})

for (const width of [360, 390, 430])
  test(`${width}px 项目 AI 卡片、详情与回到业务页`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/ai?analyze=1&q=' + encodeURIComponent('比较代理佣金与结算条款'))
    await expect(
      page.getByRole('heading', { name: '代理佣金与扣减解读', exact: true }),
    ).toBeVisible()
    const overflow = await page
      .locator('.ac-project,.ac-project-table')
      .evaluateAll((nodes) => nodes.some((n) => n.scrollWidth > n.clientWidth + 1))
    expect(overflow).toBe(false)
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/ai-project/agents-${width}.png` })
    await page.getByRole('button', { name: '来源与更新时间', exact: true }).click()
    if (process.env.AEGIS_CAPTURE_UI === '1')
      await page.screenshot({ path: `outputs/ai-project/sources-${width}.png` })
    await page.getByRole('dialog').getByRole('button', { name: '收起抽屉', exact: true }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await page.getByRole('link', { name: '打开代理政策与试算', exact: true }).click()
    await expect(page).toHaveURL(/section=agents/)
  })

test('监测详情的 AI 解读与数据保持一致', async ({ page }) => {
  await page.goto('/monitor?platform=B')
  await page
    .getByRole('dialog')
    .getByRole('link', { name: '让 AI 解读平台数据', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: '平台出入金与风险解读', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.ac-project-intro')).toContainText('8 分钟')
})
test('对比页大小球的 AI 解读不会切换为让球', async ({ page }) => {
  await page.goto('/compare?match=harbor-mountain&market=total&panel=market')
  await page
    .getByRole('dialog')
    .getByRole('link', { name: '让 AI 解读当前数据', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: '海港队 vs 山城队', exact: true })).toBeVisible()
  await expect(page.locator('.ac-project-intro')).toContainText('总进球 2.5')
  await expect(page.getByRole('region', { name: '同盘口大 2.5报价', exact: true })).toBeVisible()
})
