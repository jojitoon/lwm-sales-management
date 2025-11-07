import { BookStockTable } from '@/components/BookStockTable';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function PreorderStockPage() {
  const session = await auth();

  const mySession = await prisma.mySession.findFirst({
    where: {
      userId: session?.user?.id as string,
      isActive: true,
    },
    include: {
      preorderSession: {
        include: {
          tableSaleSession: true,
        },
      },
      user: true,
    },
  });

  const settings = await prisma.setting.findFirst({
    where: {
      id: 'settings',
    },
  });

  // Get table sale session from preorder session
  const tableSale = mySession?.preorderSession?.tableSaleSession;

  if (!tableSale) {
    return (
      <main className='px-4 lg:px-6'>
        <div className='flex justify-between items-center my-4'>
          <h1 className='text-2xl font-bold'>Preorder Stock Management</h1>
        </div>
        <div className='text-center py-8'>
          <p className='text-gray-500'>
            No table session linked. Please contact your administrator to link
            your preorder session to a table.
          </p>
        </div>
      </main>
    );
  }

  const stock = (tableSale.data as any)?.list || [];

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center my-4'>
        <div>
          <h1 className='text-2xl font-bold'>Preorder Stock Management</h1>
          <p className='text-sm text-gray-500 mt-1'>
            Table: {tableSale.name} ({tableSale.tableId})
          </p>
        </div>
      </div>

      <BookStockTable data={stock} stockType='table-stock' />
    </main>
  );
}

