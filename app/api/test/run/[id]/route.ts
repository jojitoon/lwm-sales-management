import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return auth(async (req) => {
    if (!req.auth?.user) {
      return new NextResponse('Not authenticated', { status: 401 });
    }
    if (!(req.auth.user as any)?.isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const runsDir = path.resolve(process.cwd(), '.test-runs');
    const logPath = path.join(runsDir, `${id}.log`);
    const statusPath = path.join(runsDir, `${id}.status`);

    if (!fs.existsSync(logPath)) {
      return new NextResponse('Run not found', { status: 404 });
    }

    const text = fs.readFileSync(logPath, 'utf8');
    const status = fs.existsSync(statusPath) ? fs.readFileSync(statusPath, 'utf8').trim() : 'unknown';

    return new NextResponse(text, {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'x-test-run-status': status === 'done' ? 'done' : 'running',
      },
    });
  })(request, {});
}

