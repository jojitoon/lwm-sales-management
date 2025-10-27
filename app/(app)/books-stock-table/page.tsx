import { BookStockTable } from '@/components/BookStockTable';
import { RequestBookFromMiniButton } from '@/components/RequestBookFromMiniButton';
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

  const tableSale = await prisma.tableSaleSession.findFirst({
    where: {
      session: settings?.currentSession as string,
      isActive: true,
      id: mySession?.tableSaleSessionId as string,
    },
  });

  const stock = (tableSale?.data as any)?.list || [];

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Table Manager Book Stock</h1>
        <div className='flex items-center gap-2'>
          <RequestBookFromMiniButton />
        </div>
      </div>

      <BookStockTable data={stock} />
    </main>
  );
}
