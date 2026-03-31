import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClosingStockRequestsTable } from '@/components/ClosingStockRequestsTable';

export default async function ClosingRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className='px-4 lg:px-6'>
        <h1 className='text-2xl font-bold my-2'>Closing Stock Requests</h1>
        <p className='text-muted-foreground'>Please sign in.</p>
      </main>
    );
  }

  const settings = await prisma.setting.findFirst({ where: { id: 'settings' } });
  const currentSession = (settings?.currentSession as string) || '';

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, email: true },
  });

  const mySession = await prisma.mySession.findFirst({
    where: {
      userId: session.user.id,
      session: currentSession,
      isActive: true,
    },
  });

  const whereClause: any = { session: currentSession };
  if (!user?.isAdmin) {
    whereClause.OR = [
      { fromUserEmail: user?.email || undefined },
      mySession?.miniStoreSessionId
        ? { toMiniStoreSessionId: mySession.miniStoreSessionId }
        : undefined,
      mySession?.mainStoreSessionId
        ? { toMainStoreSessionId: mySession.mainStoreSessionId }
        : undefined,
    ].filter(Boolean);
  }

  const requests = await prisma.closingStockRequest.findMany({
    where: whereClause,
    include: {
      fromTableSaleSession: true,
      fromMiniStoreSession: true,
      toMiniStoreSession: true,
      toMainStoreSession: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Closing Stock Requests</h1>
      </div>

      <ClosingStockRequestsTable initialRequests={requests} />
    </main>
  );
}

