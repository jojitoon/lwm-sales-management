import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params;

  return auth(async (req) => {
    if (!req.auth?.user) {
      return new NextResponse('Not authenticated', { status: 401 });
    }
    if (!(req.auth.user as any)?.isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const reportRoot = path.resolve(process.cwd(), 'playwright-report');
    const rel = parts.length ? parts.join('/') : 'index.html';
    const resolved = path.resolve(reportRoot, rel);

    // Prevent path traversal.
    if (!resolved.startsWith(reportRoot + path.sep)) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      return new NextResponse('Report file not found. Run Playwright to generate it.', { status: 404 });
    }

    const ext = path.extname(resolved).toLowerCase();
    const ct = contentTypes[ext] ?? 'application/octet-stream';
    const buf = fs.readFileSync(resolved);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'content-type': ct,
        'cache-control': 'no-store',
      },
    });
  })(request, {});
}

