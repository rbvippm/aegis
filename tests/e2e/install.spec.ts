import { test, expect } from '@playwright/test'
test('浏览器首页底部安装入口区分两版 iOS，步骤可滚动且没有布局溢出', async ({ page }) => {
  await page.goto('/')
  const entry = page.getByRole('button', { name: '下载官方 APP，查看安装步骤', exact: true })
  const entryBox = await entry.boundingBox()
  const dockBox = await page.getByRole('navigation', { name: '主导航', exact: true }).boundingBox()
  expect(entryBox!.y).toBeGreaterThan(0)
  expect(entryBox!.y + entryBox!.height).toBeLessThan(dockBox!.y)
  await entry.click()
  const drawer = page.getByRole('dialog', { name: '添加 Aegis 到桌面', exact: true })
  await expect(drawer).toContainText('无需下载安装包')
  await expect(drawer.getByRole('combobox')).toHaveCount(0)
  const versionSwitch = drawer.getByRole('button', { name: /界面不同/ })
  if ((await versionSwitch.innerText()).includes('查看新版')) await versionSwitch.click()
  await expect(drawer.locator('.install-guide__steps li')).toHaveCount(5)
  await expect(drawer.getByRole('img', { name: /操作示意/ })).toHaveCount(5)
  await expect(drawer).toContainText('作为网页 App 打开')
  await versionSwitch.click()
  await expect(drawer.locator('.install-guide__steps li')).toHaveCount(4)
  await expect(drawer.getByRole('img', { name: /操作示意/ })).toHaveCount(4)
  await expect(drawer).toContainText('点击共享图标')
  await versionSwitch.click()
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 793 })
    expect(
      await drawer.locator('.install-guide').evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true)
    expect(
      await drawer.evaluate((e) => e.getBoundingClientRect().height <= innerHeight * 0.8 + 1),
    ).toBe(true)
  }
  await drawer.getByRole('button', { name: '我知道了', exact: true }).click()
  await expect(drawer).not.toBeVisible()
  await expect(entry).toBeVisible()
})
test('从主屏幕独立窗口打开时不展示安装入口', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window)
    window.matchMedia = (query) => {
      const value = original(query)
      if (query === '(display-mode: standalone)')
        Object.defineProperty(value, 'matches', { value: true })
      return value
    }
  })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: '想了解什么？问问 AI', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.install-entry')).toHaveCount(0)
})
test('Telegram Mini App 不展示浏览器安装入口', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'Telegram', {
      value: {
        WebApp: {
          initData: 'ui-test',
          ready() {},
          expand() {},
          isVersionAtLeast() {
            return false
          },
          onEvent() {},
          offEvent() {},
          BackButton: { hide() {}, show() {}, onClick() {}, offClick() {} },
        },
      },
    })
  })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: '想了解什么？问问 AI', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.install-entry')).toHaveCount(0)
})

test('iPhone 15 Pro Max 首屏可见，滚动后仍固定在底栏上方', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/')
  const entry = page.locator('.install-entry')
  await expect(entry).toBeVisible()
  const before = await entry.boundingBox()
  const dock = await page.getByRole('navigation', { name: '主导航', exact: true }).boundingBox()
  expect(before!.y + before!.height).toBeLessThan(dock!.y)
  expect(before!.x).toBeGreaterThanOrEqual(0)
  expect(before!.x + before!.width).toBeLessThanOrEqual(430)
  await page.locator('#main-content').evaluate((e) => {
    e.scrollTop = e.scrollHeight
  })
  const after = await entry.boundingBox()
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(1)
  expect(before!.width).toBeGreaterThan(350)
  expect(before!.height).toBeLessThanOrEqual(90)
  expect(before!.y).toBeGreaterThan(932 * 0.7)
  await expect(page.locator('.install-entry-space')).toHaveCount(1)
})

for (const device of [
  {
    name: 'Android',
    ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
    label: 'Android · Chrome',
    count: 3,
    width: 430,
  },
  {
    name: '电脑',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    label: '电脑浏览器',
    count: 3,
    width: 1280,
  },
  {
    name: '窄屏模拟',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    label: '手机界面 · Safari 指引',
    count: 5,
    width: 430,
  },
])
  test(`${device.name} 自动展示对应图文指引`, async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: device.ua,
      viewport: { width: device.width, height: 932 },
    })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:6173/')
    await page.getByRole('button', { name: '下载官方 APP，查看安装步骤', exact: true }).click()
    const drawer = page.getByRole('dialog', { name: '添加 Aegis 到桌面', exact: true })
    await expect(drawer.locator('.install-guide__device')).toContainText(device.label)
    await expect(drawer.getByRole('combobox')).toHaveCount(0)
    await expect(drawer.getByRole('img', { name: /操作示意/ })).toHaveCount(device.count)
    await context.close()
  })

test('手动关闭后刷新仍隐藏，24小时到期只恢复横条', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T10:00:00+08:00') })
  await page.goto('/')
  const entry = page.locator('.install-entry')
  await expect(entry).toBeVisible()
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 932 })
    expect(await entry.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true)
    const get = await entry
      .getByRole('button', { name: '下载官方 APP，查看安装步骤', exact: true })
      .boundingBox()
    const close = await entry
      .getByRole('button', { name: '关闭下载提示，24小时内不再显示', exact: true })
      .boundingBox()
    expect(get!.x + get!.width).toBeLessThanOrEqual(close!.x)
    expect(close!.width).toBeGreaterThanOrEqual(44)
  }
  await entry.getByRole('button', { name: '关闭下载提示，24小时内不再显示', exact: true }).click()
  await expect(entry).toHaveCount(0)
  await expect(page.locator('.install-entry-space')).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: '想了解什么？问问 AI', exact: true }),
  ).toBeVisible()
  await expect(entry).toHaveCount(0)
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 200)))
  const remaining = await page.evaluate(() => Number(localStorage.getItem('aegis-install-dismiss-until-v1')) - Date.now())
  await page.clock.fastForward(remaining - 1)
  await expect(entry).toHaveCount(0)
  await page.clock.fastForward(1)
  await expect(entry).toBeVisible()
  await expect(
    page.getByRole('dialog', { name: '添加 Aegis 到桌面', exact: true }),
  ).not.toBeVisible()
})
