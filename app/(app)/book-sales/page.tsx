import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookSalesForm } from '@/components/BookSalesForm';
import { BookSalesTable } from '@/components/BookSalesTable';
import { Badge } from '@/components/ui/badge';

export default async function BookSales() {
  const session = await auth();

  const settings = await prisma.setting.findFirst({
    where: {
      id: 'settings',
    },
  });

  // Get the user's session to find their table sale session
  const mySession = await prisma.mySession.findFirst({
    where: {
      userId: session?.user?.id,
      session: settings?.currentSession as string,
      workspace: { in: ['table-manager', 'book-sales'] },
      isActive: true,
    },
    include: {
      tableSaleSession: true,
    },
  });

  if (!mySession?.tableSaleSession) {
    return (
      <main className='px-4 lg:px-6'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-2xl font-bold my-2'>Book Sales</h1>
        </div>
        <div className='text-center py-8'>
          <p className='text-gray-500'>
            No table session found. Please contact your administrator.
          </p>
        </div>
      </main>
    );
  }

  // Get stock from the shared table sale session
  const stock = (mySession.tableSaleSession.data as any)?.list || [];
  const isStockClosed = !!(mySession.tableSaleSession.data as any)?.closingStock;

  const tableSale = await prisma.tableSaleSession.findFirst({
    where: {
      id: mySession.tableSaleSession.id,
    },
    include: {
      bookSales: {
        include: {
          items: {
            include: {
              book: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center my-4'>
        <h1 className='text-2xl font-bold '>Book Sales</h1>
        {isStockClosed && (
          <Badge variant='destructive' className='mr-2'>
            Stock Closed
          </Badge>
        )}
        {mySession?.workspace === 'book-sales' && (
          <div className='flex items-center gap-2'>
            <BookSalesForm availableStock={stock} disabled={isStockClosed} />
          </div>
        )}
      </div>

      <BookSalesTable sales={tableSale?.bookSales || []} />
    </main>
  );
}
