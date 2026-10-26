import { test, expect } from '@playwright/test'

test('专属邀请海报、复制和系统分享保持同一个码', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { sharePayload?: unknown; copiedInvite?: string }
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        state.sharePayload = {
          title: data.title,
          text: data.text,
          url: data.url,
          files: data.files?.map((f) => ({ name: f.name, type: f.type, size: f.size })),
        }
      },
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          state.copiedInvite = value
        },
      },
    })
  })
  await page.goto('/me')
  await page.getByRole('button', { name: '邀请好友', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: '邀请好友', exact: true })
  const poster = drawer.getByRole('img', { name: /Aegis 专属邀请海报/ })
  await expect(poster).toBeVisible()
  expect(await poster.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBe(1080)
  const link = await drawer.getByRole('textbox', { name: '邀请链接', exact: true }).inputValue()
  const code = new URL(link).searchParams.get('ref')!
  await page.addScriptTag({ path: 'node_modules/jsqr/dist/jsQR.js' })
  const decoded = await poster.evaluate((element) => {
    const image = element as HTMLImageElement
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const decoder = (
      window as typeof window & {
        jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null
      }
    ).jsQR
    return decoder(pixels.data, pixels.width, pixels.height)?.data
  })
  expect(decoded).toBe(link)

  expect(code).toMatch(/^AE[A-Z0-9]{8,12}$/)
  await drawer.getByRole('button', { name: '复制邀请码', exact: true }).click()
  expect(
    await page.evaluate(() => (window as typeof window & { copiedInvite: string }).copiedInvite),
  ).toBe(code)
  await drawer.getByRole('button', { name: '复制邀请链接', exact: true }).click()
  expect(
    await page.evaluate(() => (window as typeof window & { copiedInvite: string }).copiedInvite),
  ).toBe(link)
  await expect(drawer.locator('.iv-channels')).toHaveCount(0)
  await drawer.getByRole('button', { name: '邀请好友', exact: true }).click()
  const payload = await page.evaluate(
    () =>
      (
        window as typeof window & {
          sharePayload: { url: string; files: { type: string; size: number }[] }
        }
      ).sharePayload,
  )
  expect(payload.url).toBe(link)
  expect(payload.files[0]!.type).toBe('image/png')
  expect(payload.files[0]!.size).toBeGreaterThan(10000)
  await expect(drawer.getByRole('status')).toContainText('已交给系统分享')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    drawer.getByRole('button', { name: '保存邀请海报', exact: true }).click(),
  ])
  expect(download.suggestedFilename()).toBe(`Aegis-Invite-${code}.png`)
  await drawer.press('Escape')
  await page.reload()
  await page.getByRole('button', { name: '邀请好友', exact: true }).click()
  await expect(drawer.getByRole('textbox', { name: '邀请链接', exact: true })).toHaveValue(link)
})

test('无系统分享时可继续复制和保存海报', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }),
  )
  await page.goto('/me')
  await page.getByRole('button', { name: '邀请好友', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: '邀请好友', exact: true })
  await expect(drawer.getByRole('img', { name: /Aegis 专属邀请海报/ })).toBeVisible()
  await drawer.getByRole('button', { name: '邀请好友', exact: true }).click()
  await expect(drawer.getByRole('status')).toContainText('当前浏览器不支持系统分享')
  await expect(drawer.locator('.iv-channels')).toHaveCount(0)
  await expect(drawer.getByRole('button', { name: '保存邀请海报', exact: true })).toBeEnabled()
  await expect(drawer.getByRole('button', { name: '复制邀请链接', exact: true })).toBeEnabled()
})
