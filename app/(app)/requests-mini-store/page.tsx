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

  const requests = await prisma.miniStoreRequest.findMany({
    where: {
      miniStoreSession: {
        session: settings?.currentSession as string,
        isActive: true,
      },
    },
    include: {
      tableSaleSession: true,
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
