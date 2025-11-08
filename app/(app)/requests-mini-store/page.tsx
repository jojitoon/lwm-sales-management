import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RequestManagementTable } from '@/components/RequestManagementTable';

export default async function MiniStoreRequests() {
  const session = await auth();

  const settings = await prisma.setting.findFirst({
    where: {
      id: 'settings',
    },
  });

  // Get user's workspace to filter by mini store type
  let miniStoreType: string | null = null;
  if (session?.user?.id) {
    const mySession = await prisma.mySession.findFirst({
      where: {
        userId: session.user.id,
        session: settings?.currentSession as string,
        workspace: { in: ['mini-store', 'preorder-ministore'] },
        isActive: true,
      },
      include: {
        miniStoreSession: true,
      },
    });
    miniStoreType = mySession?.miniStoreSession?.type || null;
  }

  const whereClause: any = {
    miniStoreSession: {
      session: settings?.currentSession as string,
      isActive: true,
    },
  };

  // If user is from a mini store, only show requests for their store type
  if (miniStoreType) {
    whereClause.miniStoreSession.type = miniStoreType;
  }

  const requests = await prisma.miniStoreRequest.findMany({
    where: whereClause,
    include: {
      tableSaleSession: true,
      miniStoreSession: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Mini Store Requests</h1>
      </div>

      <RequestManagementTable requests={requests} type='mini-store' />
    </main>
  );
}
