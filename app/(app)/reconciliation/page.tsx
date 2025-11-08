import { ReconciliationReport } from '@/components/ReconciliationReport';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ReconciliationPage() {
  const session = await auth();

  if (!session?.user || !(session.user as any)?.isAdmin) {
    return (
      <main className='px-4 lg:px-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-gray-500'>Access denied. Admin only.</div>
        </div>
      </main>
    );
  }

  const settings = await prisma.setting.findFirst({
    where: { id: 'settings' },
  });

  // Get all sessions for filtering
  const allSessions = await prisma.tableSaleSession.findMany({
    select: {
      session: true,
    },
    distinct: ['session'],
    orderBy: {
      session: 'desc',
    },
  });

  const sessions = Array.from(
    new Set(allSessions.map((s) => s.session))
  ).sort();

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Reconciliation Report</h1>
      </div>

      <ReconciliationReport
        currentSession={settings?.currentSession || ''}
        availableSessions={sessions}
      />
    </main>
  );
}

