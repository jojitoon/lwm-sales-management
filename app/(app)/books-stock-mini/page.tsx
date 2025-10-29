import { BookStockTable } from '@/components/BookStockTable';
import { RequestBookFromMainButton } from '@/components/RequestBookFromMainButton';
import { PendingRequestsButton } from '@/components/PendingRequestsButton';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function MiniStoreBookStock() {
  const session = await auth();

  const settings = await prisma.setting.findFirst({
    where: {
      id: 'settings',
    },
  });

  // Get user's session to determine workspace
  const mySession = await prisma.mySession.findFirst({
    where: {
      userId: session?.user?.id as string,
      session: settings?.currentSession as string,
      isActive: true,
    },
  });

  const miniStore = await prisma.miniStoreSession.findFirst({
    where: {
      session: settings?.currentSession as string,
      isActive: true,
    },
  });

  const stock = (miniStore?.data as any)?.list || [];

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Mini Store Book Stock</h1>
        <div className='flex items-center gap-2'>
          <PendingRequestsButton
            type='main-store'
            workspace={mySession?.workspace as string}
          />
          <RequestBookFromMainButton />
        </div>
      </div>

      <BookStockTable data={stock} stockType='mini-store-stock' />
    </main>
  );
}
