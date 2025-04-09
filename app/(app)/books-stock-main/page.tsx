import { BookStockTable } from '@/components/BookStockTable';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function BookLeftReport() {
  const session = await auth();

  const settings = await prisma.setting.findFirst({
    where: {
      id: 'settings',
    },
  });

  const mainStore = await prisma.mainStoreSession.findFirst({
    where: {
      session: settings?.currentSession as string,
      isActive: true,
    },
  });

  console.log(mainStore);

  const stock = (mainStore?.data as any)?.list || [];

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8 '>
        <h1 className='text-2xl font-bold my-2'>All Books Stock</h1>
      </div>

      <BookStockTable data={stock} />
    </main>
  );
}
