// Run explicitly with `node scripts/generate-social-card.mjs`; no browser downloads.
// Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH when using a system browser.
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = new URL('../', import.meta.url)
const asset = async (path, type) =>
  `data:${type};base64,${(await readFile(new URL(path, root))).toString('base64')}`
const html = (await readFile(new URL('scripts/social-card.html', root), 'utf8'))
  .replace('__MARK__', await asset('src/shared/assets/aegis-mark.png', 'image/png'))
  .replace('__GLACIER__', await asset('src/shared/assets/glacier-hero.jpg', 'image/jpeg'))
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
})
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  await page.setContent(html)
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(Array.from(document.images, (image) => image.decode()))
  })
  for (const variant of ['wide', 'square']) {
    await page.locator('.artboard').evaluate((board, square) => {
      board.classList.toggle('square', square)
    }, variant === 'square')
    const file = new URL(`public/social/preview-v2-${variant}.jpg`, root)
    const jpeg = await page.locator('.artboard').screenshot({ type: 'jpeg', quality: 88 })
    await writeFile(file, jpeg)
    console.log(`${fileURLToPath(file)}: ${Math.round(jpeg.length / 1024)} KB`)
  }
} finally {
  await browser.close()
}
