import { BookStockTable } from '@/components/BookStockTable';
import { CloseStockButton } from '@/components/CloseStockButton';
import { OpenStockButton } from '@/components/OpenStockButton';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function BookLeftReport() {
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

  const mainStore = await prisma.mainStoreSession.findFirst({
    where: {
      session: settings?.currentSession as string,
      isActive: true,
    },
  });

  const stock = (mainStore?.data as any)?.list || [];
  const isStockClosed = !!mainStore?.closingStock;

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex md:flex-row flex-col md:items-center justify-between items-center mb-8 gap-2'>
        <div className='flex items-center gap-4'>
          <h1 className='text-2xl font-bold my-2'>All Books Stock</h1>
          {isStockClosed && (
            <Badge variant='outline' className='bg-yellow-50 text-yellow-800'>
              Stock Closed
            </Badge>
          )}
        </div>
        {isStockClosed ? (
          <OpenStockButton workspace='main-store' />
        ) : (
          <CloseStockButton workspace='main-store' />
        )}
      </div>

      <BookStockTable data={stock} stockType='main-store-stock' />
    </main>
  );
}
