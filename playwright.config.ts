import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'dot',
  use: {
    baseURL: 'http://127.0.0.1:6173',
    headless: true,
    trace: process.env.AEGIS_CAPTURE_UI === '1' ? 'retain-on-failure' : 'off',
    screenshot: 'off',
    video: 'off',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev -- --port 6173 --strictPort',
    url: 'http://127.0.0.1:6173',
    reuseExistingServer: !process.env.CI,
  },
})
