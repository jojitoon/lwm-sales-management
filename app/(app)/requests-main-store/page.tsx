import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RequestManagementTable } from '@/components/RequestManagementTable';

export default async function MainStoreRequests() {
  const session = await auth();

  const settings = await prisma.setting.findFirst({
    where: {
      id: 'settings',
    },
  });

  const requests = await prisma.mainStoreRequest.findMany({
    where: {
      mainStoreSession: {
        session: settings?.currentSession as string,
        isActive: true,
      },
    },
    include: {
      miniStoreSession: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Main Store Requests</h1>
      </div>

      <RequestManagementTable requests={requests} type='main-store' />
    </main>
  );
}
