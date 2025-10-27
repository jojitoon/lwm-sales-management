import { BookStockTable } from '@/components/BookStockTable';
import { RequestBookFromMainButton } from '@/components/RequestBookFromMainButton';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function MiniStoreBookStock() {
  const session = await auth();

  const settings = await prisma.setting.findFirst({
    where: {
      id: 'settings',
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
          <RequestBookFromMainButton />
        </div>
      </div>

      <BookStockTable data={stock} />
    </main>
  );
}
