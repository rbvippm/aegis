import { test, expect } from '@playwright/test'

test('个人中心入口、移除项与新增反馈和关于', async ({ page }) => {
  await page.goto('/me')
  await expect(page.locator('.pf-income')).toContainText('128.50')
  await expect(page.locator('.pf-page')).not.toContainText('福利码')
  await page.getByRole('button', { name: '账户设置', exact: true }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).not.toContainText(/公开展示活动|评价公开|减少透明度|账户注销/)
  await expect(drawer).toContainText('工单证据')
  await drawer.getByRole('button', { name: '关于我们', exact: true }).click()
  await expect(drawer).toContainText('不保管用户资金')
  await drawer.getByRole('button', { name: '收起抽屉' }).click()
  await expect(drawer).not.toBeVisible()
  await page.getByRole('button', { name: '意见反馈', exact: true }).click()
  await drawer.getByLabel('反馈内容').fill('这里是一条关于界面和数据来源的测试建议。')
  await drawer.getByRole('button', { name: '保存反馈' }).click()
  await expect(drawer.getByRole('status')).toContainText('反馈已保存')
})

test('收益分类和绑定 UID 不等于资格通过', async ({ page }) => {
  await page.goto('/me?section=earnings')
  const platform = page.getByRole('article', { name: '平台 C', exact: true })
  await platform.getByRole('button', { name: '绑定平台 C UID' }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByLabel('平台 UID').fill('local_1234')
  await drawer.getByRole('button', { name: '保存 UID' }).click()
  await expect(drawer.getByRole('status')).toContainText('奖励资格待验证')
  await page.keyboard.press('Escape')
  await expect(platform).toContainText('UID 已绑定')
  await expect(platform).toContainText('待验证')
  await page.getByRole('button', { name: '收益明细', exact: true }).click()
  await expect(page.locator('.pf-record')).toHaveCount(3)
  await expect(page.getByRole('button', { name: /提现|充值|领取/ })).toHaveCount(0)
})

test('新建工单与补充材料仅保存本地草稿，筛选有空状态', async ({ page }) => {
  await page.goto('/me?section=tickets')
  await page.getByRole('button', { name: '新建工单' }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByLabel('问题描述').fill('我在平台申请了出金，希望核对到账时间与交易记录。')
  await drawer.getByLabel('争议金额').fill('12.50')
  await drawer.getByRole('button', { name: '保存工单' }).click()
  await expect(drawer.getByRole('status')).toContainText('工单已保存')
  await page.keyboard.press('Escape')
  await expect(page.locator('.pf-ticket')).toHaveCount(3)
  await expect(page.locator('.pf-ticket').first()).toContainText('草稿')
  await page.getByRole('button', { name: '补充材料', exact: true }).click()
  await drawer.getByLabel('补充描述').fill('补充申请时间和交易记录，但仅保存本地草稿。')
  await drawer.getByRole('button', { name: '保存补充' }).click()
  await expect(drawer.getByRole('status')).toContainText('补充材料已保存')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '已结束', exact: true }).click()
  await expect(page.getByRole('heading', { name: '暂无已结束工单' })).toBeVisible()
})

test('游客浏览与真实登录说明不伪造认证', async ({ page }) => {
  await page.goto('/me')
  await page.getByRole('button', { name: '账户设置', exact: true }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByRole('button', { name: '退出登录', exact: true }).click()
  await drawer.getByRole('button', { name: '切换为游客' }).click()
  await expect(page.locator('.pf-identity')).toContainText('游客')
  await expect(page.locator('.pf-income')).toHaveCount(0)
  await page.getByRole('button', { name: '登录与身份说明' }).click()
  await expect(drawer).toContainText('支持 Telegram 或邮箱登录')
  await drawer.getByRole('button', { name: '进入我的账号' }).click()
  await expect(page.locator('.pf-income')).toContainText('128.50')
})

test('消息已读与通知偏好保持本地边界', async ({ page }) => {
  await page.goto('/me?section=messages')
  await expect(page.locator('.pf-notice-mark:not(.read)')).toHaveCount(2)
  await page.getByRole('button', { name: '全部标为已读' }).click()
  await expect(page.locator('.pf-notice-mark:not(.read)')).toHaveCount(0)
  await page.getByRole('button', { name: '通知渠道与偏好' }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByLabel('Telegram').check()
  await drawer.getByRole('button', { name: '保存', exact: true }).click()
  await expect(drawer.getByRole('status')).toContainText('通知偏好已保存')
})

for (const width of [360, 390, 430]) {
  test(`${width}px 个人中心四种状态与底栏留白`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const section of ['', 'earnings', 'tickets', 'messages', 'follows', 'history']) {
      await page.goto('/me' + (section ? '?section=' + section : ''))
      await expect(page.locator('.page-enter-active')).toHaveCount(0)
      await expect(page.locator('.pf-mode')).toHaveCount(0)
      await page.screenshot({
        path: `outputs/profile-implementation/${section || 'overview'}-${width}.png`,
        animations: 'disabled',
      })
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
      await page.evaluate(() => {
        const main = document.getElementById('main-content')
        main?.scrollTo(0, main.scrollHeight)
      })
      await page.screenshot({
        path: `outputs/profile-implementation/${section || 'overview'}-bottom-${width}.png`,
        animations: 'disabled',
      })
      const content = await page.locator('.pf-content').boundingBox(),
        dock = await page.locator('.ae-dock').boundingBox()
      expect(content!.y + content!.height).toBeLessThanOrEqual(dock!.y)
    }
    await page.goto('/me')
    await page.getByRole('button', { name: '账户设置', exact: true }).click()
    await page.waitForTimeout(350)
    await page.screenshot({ path: `outputs/profile-implementation/settings-${width}.png` })
    expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      false,
    )
    await page.getByRole('button', { name: '收起抽屉' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    expect(errors).toEqual([])
  })
}

test('体育关注在我的页面同步展示，取消后回到对比页生效', async ({ page }) => {
  await page.goto('/compare')
  await page.getByRole('button', { name: '关注北辰队', exact: true }).click()
  await page.getByRole('navigation').getByRole('link', { name: '我的', exact: true }).click()
  await page.getByRole('button', { name: '我的关注', exact: true }).click()
  await expect(page.locator('.pf-content')).toContainText('北辰队 vs 南岳队')
  await page.getByRole('button', { name: '取消关注', exact: true }).click()
  await expect(page.getByRole('heading', { name: '暂无关注赛事' })).toBeVisible()
  await page.getByRole('link', { name: '去体育对比页' }).click()
  await expect(page.getByRole('button', { name: '关注北辰队', exact: true })).toBeVisible()
})

test('我的 AI 记录恢复当前标签页的实际会话', async ({ page }) => {
  await page.goto('/ai')
  await page.getByRole('button', { name: '今晚维拉 vs 曼城，怎么看？', exact: true }).click()
  await expect(page.getByRole('region', { name: '方向参考' })).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: '我的', exact: true }).click()
  await page.getByRole('button', { name: 'AI 记录', exact: true }).click()
  await page.getByRole('button', { name: /今晚维拉 vs 曼城.*1 个问题/ }).click()
  await expect(page).toHaveURL(/\/ai$/)
  await expect(page.getByRole('region', { name: '方向参考' })).toBeVisible()
})
