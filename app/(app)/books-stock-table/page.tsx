import { BookStockTable } from '@/components/BookStockTable';
import { RequestBookFromMiniButton } from '@/components/RequestBookFromMiniButton';
import { PendingRequestsButton } from '@/components/PendingRequestsButton';
import { CloseStockButton } from '@/components/CloseStockButton';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function TableManagerBookStock() {
  const session = await auth();

  const mySession = await prisma.mySession.findFirst({
    where: {
      userId: session?.user?.id as string,
      isActive: true,
    },
    include: {
      tableSaleSession: true,
      user: true,
    },
  });

  const settings = await prisma.setting.findFirst({
    where: {
      id: 'settings',
    },
  });

  // Get user's table sale session for the current session
  const tableSale = await prisma.tableSaleSession.findFirst({
    where: {
      session: settings?.currentSession as string,
      isActive: true,
      id: mySession?.tableSaleSessionId as string,
    },
  });

  const stock = (tableSale?.data as any)?.list || [];
  const isStockClosed = !!(tableSale?.data as any)?.closingStock;

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between md:flex-row flex-col md:items-center my-4 gap-2'>
        <h1 className='text-2xl font-bold '>Table Manager Book Stock</h1>
        {isStockClosed && (
          <Badge variant='destructive' className='mr-2'>
            Stock Closed
          </Badge>
        )}
        {mySession?.workspace === 'table-manager' && (
          <div className='flex md:flex-row flex-col md:items-center gap-2'>
            <PendingRequestsButton
              type='mini-store'
              workspace={mySession.workspace}
            />
            <RequestBookFromMiniButton disabled={isStockClosed} />
            <CloseStockButton workspace='table-manager' />
          </div>
        )}
        {mySession?.workspace === 'pre-order' && (
          <div className='text-sm text-gray-500'>
            Linked to Table: {tableSale?.name} ({tableSale?.tableId})
          </div>
        )}
      </div>

      <BookStockTable data={stock} stockType='table-stock' />
    </main>
  );
}
