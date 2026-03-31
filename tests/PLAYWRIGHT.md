# Playwright “UI Viewer” Tests

These tests are meant to be **watched** while they run (multi-role, multi-page).

## 1) Set environment variables

The auth setup logs in via NextAuth credentials and saves storage states in `.auth/`.

Set these env vars in your shell (or a local, uncommitted `.env` file you source):

- `PLAYWRIGHT_BASE_URL` (default: `http://127.0.0.1:3010`)
- `PW_USER_EMAIL` (the email used for the credentials provider)
- `PW_BOOK_SALES_TABLE_ID` (required for `book-sales`)
- `PW_TABLE_MANAGER_TABLE_TYPE` (required for `table-manager`, e.g. `pos`)

## 2) Start the app

Run your app in another terminal:

```bash
PORT=3010 HOSTNAME=127.0.0.1 pnpm dev
```

## 3) Generate auth states

```bash
pnpm test:e2e:auth
```

## 4) Run the viewer test (watch it)

```bash
pnpm test:e2e:ui
```

The spec `tests/flows/multi-role-viewer.spec.ts` opens 3 roles at once in headed mode so you can visually track them.

