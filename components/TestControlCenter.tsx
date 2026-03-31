'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RunKind = 'auth' | 'viewer' | 'ui';

type RunResponse =
  | { ok: true; id: string }
  | { ok: false; error: string };

export function TestControlCenter() {
  const [baseURL, setBaseURL] = useState(
    process.env.NEXT_PUBLIC_PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3010'
  );
  const [email, setEmail] = useState('');
  const [bookSalesTableId, setBookSalesTableId] = useState('');
  const [tableManagerTableType, setTableManagerTableType] = useState('pos');

  const [running, setRunning] = useState<RunKind | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const env = useMemo(
    () => ({
      PLAYWRIGHT_BASE_URL: baseURL,
      PW_USER_EMAIL: email,
      PW_BOOK_SALES_TABLE_ID: bookSalesTableId,
      PW_TABLE_MANAGER_TABLE_TYPE: tableManagerTableType,
    }),
    [baseURL, email, bookSalesTableId, tableManagerTableType]
  );

  async function start(kind: RunKind) {
    setError(null);
    setLogs('');
    setRunId(null);
    setRunning(kind);

    const res = await fetch('/api/test/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind, env }),
    });
    const json = (await res.json()) as RunResponse;
    if (!json.ok) {
      setRunning(null);
      setError(json.error);
      return;
    }

    setRunId(json.id);

    // Poll logs. Keep it simple and robust.
    const poll = async () => {
      try {
        const lr = await fetch(`/api/test/run/${json.id}`, { cache: 'no-store' });
        const text = await lr.text();
        setLogs(text);

        if (lr.headers.get('x-test-run-status') === 'done') {
          setRunning(null);
          return;
        }
        setTimeout(poll, 1000);
      } catch (e: any) {
        setRunning(null);
        setError(e?.message ?? 'Failed to read logs');
      }
    };

    poll();
  }

  const disabled =
    !env.PLAYWRIGHT_BASE_URL ||
    !env.PW_USER_EMAIL ||
    !env.PW_BOOK_SALES_TABLE_ID ||
    !env.PW_TABLE_MANAGER_TABLE_TYPE ||
    Boolean(running);

  return (
    <div className='grid gap-4'>
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>
            These values are used to generate role storage states and run viewer flows.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='baseURL'>Base URL</Label>
            <Input id='baseURL' value={baseURL} onChange={(e) => setBaseURL(e.target.value)} placeholder='http://localhost:3000' />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='email'>User email (credentials)</Label>
            <Input id='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='m@example.com' />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='tableId'>Book-sales table id</Label>
            <Input id='tableId' value={bookSalesTableId} onChange={(e) => setBookSalesTableId(e.target.value)} placeholder='T1' />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='tableType'>Table-manager table type</Label>
            <Input id='tableType' value={tableManagerTableType} onChange={(e) => setTableManagerTableType(e.target.value)} placeholder='pos' />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Run</CardTitle>
          <CardDescription>
            Runs commands on the server (dev only). Use “Playwright UI” to watch tests and control them.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          <Button onClick={() => start('auth')} disabled={disabled}>
            Generate auth states
          </Button>
          <Button onClick={() => start('viewer')} disabled={disabled}>
            Run multi-role viewer (headed)
          </Button>
          <Button onClick={() => start('ui')} disabled={disabled}>
            Open Playwright UI runner
          </Button>
          <Button asChild variant='secondary'>
            <a href='/api/test/report/index.html' target='_blank' rel='noreferrer'>
              Open HTML report
            </a>
          </Button>
        </CardContent>
      </Card>

      {(error || runId || logs) && (
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              {running ? `Running: ${running}` : runId ? `Last run: ${runId}` : '—'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className='mb-3 text-sm text-red-600'>{error}</div>}
            <pre className='max-h-[420px] overflow-auto rounded-md border bg-muted p-3 text-xs whitespace-pre-wrap'>
              {logs || 'No logs yet.'}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

