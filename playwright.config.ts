import { defineConfig, devices } from '@playwright/test';

// Default to a non-3000 port to avoid colliding with other local Next apps.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3010';
const parsedBase = new URL(baseURL);
const serverPort = parsedBase.port || '3000';
const serverHost = parsedBase.hostname || '127.0.0.1';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // Keep the DB schema in sync for UI flows (avoids runtime P2021 missing-table errors).
        command: `pnpm exec prisma db push && PORT=${serverPort} HOSTNAME=${serverHost} pnpm dev`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'auth-setup',
      testMatch: /.*\.auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'book-sales (chromium)',
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/book-sales.json',
      },
    },
    {
      name: 'table-manager (chromium)',
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/table-manager.json',
      },
    },
    {
      name: 'mini-store (chromium)',
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/mini-store.json',
      },
    },
  ],
});

