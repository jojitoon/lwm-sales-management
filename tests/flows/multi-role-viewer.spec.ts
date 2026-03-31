import { test, expect, chromium, type BrowserContext } from '@playwright/test';

test('multi-role viewer: open 3 workspaces side-by-side', async ({ baseURL }) => {
  // This test intentionally creates multiple contexts at once so you can *see*
  // different roles progressing simultaneously in headed/UI mode.
  const browser = await chromium.launch({ headless: false });

  const contexts: { role: string; context: BrowserContext; storageState: string }[] = [
    { role: 'book-sales', context: await browser.newContext({ storageState: '.auth/book-sales.json' }), storageState: '.auth/book-sales.json' },
    { role: 'table-manager', context: await browser.newContext({ storageState: '.auth/table-manager.json' }), storageState: '.auth/table-manager.json' },
    { role: 'mini-store', context: await browser.newContext({ storageState: '.auth/mini-store.json' }), storageState: '.auth/mini-store.json' },
  ];

  const pages = await Promise.all(
    contexts.map(async ({ role, context }) => {
      const page = await context.newPage();
      await page.goto(baseURL ?? 'http://localhost:3000', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
      await page.evaluate((r) => (document.title = `LWM – ${r}`), role);
      return { role, page };
    })
  );

  // Role-specific visual “proof” that each dashboard is different.
  await expect(pages.find((p) => p.role === 'book-sales')!.page.getByText('Total Sales')).toBeVisible();
  await expect(pages.find((p) => p.role === 'table-manager')!.page.getByText('Total Stock Value')).toBeVisible();
  await expect(pages.find((p) => p.role === 'mini-store')!.page.getByText('Pending Requests')).toBeVisible();

  // Small delay so the UI runner clearly shows all pages open.
  await pages[0]!.page.waitForTimeout(1500);

  await Promise.all(contexts.map(({ context }) => context.close()));
  await browser.close();
});

