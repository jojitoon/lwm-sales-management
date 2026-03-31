import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

type RunKind = 'auth' | 'viewer' | 'ui';

function isRunKind(value: unknown): value is RunKind {
  return value === 'auth' || value === 'viewer' || value === 'ui';
}

export async function POST(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth?.user) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }
    if (!(req.auth.user as any)?.isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { ok: false, error: 'Test runner is disabled in production' },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => null)) as
      | { kind?: unknown; env?: Record<string, unknown> }
      | null;

    const kind = body?.kind;
    if (!isRunKind(kind)) {
      return NextResponse.json({ ok: false, error: 'Invalid kind' }, { status: 400 });
    }

    const envIn = body?.env ?? {};
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(envIn)) {
      if (typeof v === 'string') env[k] = v;
    }

    const id = crypto.randomUUID();
    const runsDir = path.resolve(process.cwd(), '.test-runs');
    fs.mkdirSync(runsDir, { recursive: true });
    const logPath = path.join(runsDir, `${id}.log`);
    const statusPath = path.join(runsDir, `${id}.status`);
    fs.writeFileSync(logPath, '');
    fs.writeFileSync(statusPath, 'running');

    const cmd = 'pnpm';
    const args =
      kind === 'auth'
        ? ['test:e2e:auth']
        : kind === 'viewer'
          ? ['exec', 'playwright', 'test', 'tests/flows/multi-role-viewer.spec.ts', '--headed']
          : ['test:e2e:ui'];

    const child = spawn(cmd, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const append = (chunk: any) => {
      fs.appendFileSync(logPath, chunk);
    };

    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.on('close', (code) => {
      append(`\n\n[exit_code] ${code ?? 'unknown'}\n`);
      fs.writeFileSync(statusPath, 'done');
    });

    return NextResponse.json({ ok: true, id });
  })(request, {});
}

