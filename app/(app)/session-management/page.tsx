import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SessionManager } from '@/components/SessionManager';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function SessionManagement() {
  const session = await auth();

  const settings = await prisma.setting.findFirst({
    where: { id: 'settings' },
  });

  // Get active sessions
  const mainStoreSessions = await prisma.mainStoreSession.findMany({
    where: {
      session: settings?.currentSession as string,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const miniStoreSessions = await prisma.miniStoreSession.findMany({
    where: {
      session: settings?.currentSession as string,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold'>Session Management</h1>
      </div>

      <div className='space-y-8'>
        {/* Active Sessions */}
        <div>
          <h2 className='text-xl font-semibold mb-4'>Active Sessions</h2>
          <SessionManager
            mainStoreSessions={mainStoreSessions}
            miniStoreSessions={miniStoreSessions}
          />
        </div>

        {/* Closing Stock Reports */}
        <div>
          <h2 className='text-xl font-semibold mb-4'>Closing Stock Reports</h2>
          <div className='rounded-md border p-4'>
            <p className='text-sm text-muted-foreground'>
              View closing stock reports from the Reports dashboard.
            </p>
            <div className='mt-3'>
              <Button asChild variant='outline'>
                <Link href='/reports'>Open Reports</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
