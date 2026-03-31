import { test as setup, expect, type Browser } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { getRoleLogin, roles } from './roles';

function parseSetCookieToPlaywrightCookie(setCookie: string, baseURL: string) {
  // Minimal Set-Cookie parser for NextAuth session cookies.
  // Good enough for `next-auth.session-token` / `__Secure-next-auth.session-token`.
  const url = new URL(baseURL);
  const parts = setCookie.split(';').map((p) => p.trim());
  const [nameValue, ...attrs] = parts;
  const eqIdx = nameValue.indexOf('=');
  if (eqIdx === -1) return null;
  const name = nameValue.slice(0, eqIdx);
  const value = nameValue.slice(eqIdx + 1);

  let cookiePath = '/';
  let domain: string | undefined;
  let expires: number | undefined;
  let secure = false;
  let httpOnly = false;
  let sameSite: 'Lax' | 'None' | 'Strict' | undefined;

  for (const attr of attrs) {
    const [kRaw, vRaw] = attr.split('=');
    const k = (kRaw ?? '').toLowerCase();
    const v = vRaw?.trim();
    if (k === 'path' && v) cookiePath = v;
    else if (k === 'domain' && v) domain = v.startsWith('.') ? v.slice(1) : v;
    else if (k === 'expires' && v) {
      const ts = Date.parse(v);
      if (!Number.isNaN(ts)) expires = Math.floor(ts / 1000);
    } else if (k === 'secure') secure = true;
    else if (k === 'httponly') httpOnly = true;
    else if (k === 'samesite' && v) {
      const s = v.toLowerCase();
      if (s === 'lax') sameSite = 'Lax';
      if (s === 'none') sameSite = 'None';
      if (s === 'strict') sameSite = 'Strict';
    }
  }

  return {
    name,
    value,
    domain: domain ?? url.hostname,
    path: cookiePath,
    expires,
    httpOnly,
    secure,
    sameSite,
  };
}

async function loginWithCredentials(
  context: Awaited<ReturnType<Browser['newContext']>>,
  baseURL: string,
  params: {
  email: string;
  workspace: string;
  tableId?: string;
  tableType?: string;
}
) {
  const csrfUrl = new URL('/api/auth/csrf', baseURL).toString();
  const csrfRes = await context.request.get(csrfUrl);
  if (!csrfRes.ok()) {
    const text = await csrfRes.text().catch(() => '');
    throw new Error(
      `Failed to fetch CSRF token (${csrfRes.status()} ${csrfRes.statusText()}) from ${csrfUrl}\n${text}`
    );
  }
  const csrfJson = (await csrfRes.json()) as { csrfToken: string };

  const body = new URLSearchParams();
  body.set('csrfToken', csrfJson.csrfToken);
  body.set('email', params.email);
  body.set('workspace', params.workspace);
  if (params.tableId) body.set('tableId', params.tableId);
  if (params.tableType) body.set('tableType', params.tableType);
  body.set('callbackUrl', '/');
  body.set('json', 'true');

  const cbUrl = new URL('/api/auth/callback/credentials', baseURL).toString();
  const cbRes = await context.request.post(cbUrl, {
    form: Object.fromEntries(body.entries()),
    maxRedirects: 0,
  });

  // NextAuth can respond 302 on success.
  expect([200, 302]).toContain(cbRes.status());

  // IMPORTANT: APIRequestContext responses do not automatically “log in” the BrowserContext.
  // We must manually copy Set-Cookie headers into the browser context’s cookie jar.
  const setCookies =
    cbRes.headersArray?.().filter((h) => h.name.toLowerCase() === 'set-cookie') ??
    [];
  const cookies = setCookies
    .map((h) => parseSetCookieToPlaywrightCookie(h.value, baseURL))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  if (cookies.length) await context.addCookies(cookies);
}

setup('authenticate workspaces and save storageState', async ({ browser, baseURL }) => {
  expect(baseURL, 'Playwright baseURL must be configured').toBeTruthy();

  const authDir = path.resolve(process.cwd(), '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  for (const role of roles) {
    const login = getRoleLogin(role);
    const context = await browser.newContext();
    // Best practice: prefer “API login” (fast, less flaky).
    // But if the baseURL points at a server that doesn't expose NextAuth endpoints,
    // fall back to UI login so the flow is still testable/visual.
    try {
      await loginWithCredentials(context, baseURL!, login);
    } catch (e: any) {
      const page = await context.newPage();
      await page.goto(new URL('/login', baseURL!).toString(), {
        waitUntil: 'domcontentloaded',
      });

      await page.getByLabel('Email').fill(login.email);

      // Workspace is a Radix Select. Click trigger then click the item.
      await page.getByLabel('Workspace').click();
      const workspaceLabel =
        login.workspace === 'book-sales'
          ? 'Book Sales'
          : login.workspace === 'table-manager'
            ? 'Table Manager'
            : 'Mini Store';
      await page.getByRole('option', { name: workspaceLabel }).click();

      if (login.workspace === 'book-sales' && login.tableId) {
        await page.getByLabel('Table Id').fill(login.tableId);
      }
      if (login.workspace === 'table-manager' && login.tableType) {
        await page.getByLabel('Table Type').click();
        const tableTypeLabel =
          login.tableType === 'pos'
            ? 'POS'
            : login.tableType === 'cash'
              ? 'Cash'
              : login.tableType === 'trf'
                ? 'Transfer'
                : login.tableType === 'qr'
                  ? 'QR'
                  : 'Preorder';
        await page.getByRole('option', { name: tableTypeLabel }).click();
      }

      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    }

    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await context.storageState({ path: path.join(authDir, `${role}.json`) });
    await context.close();
  }
});

