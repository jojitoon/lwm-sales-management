import { BookTable } from '@/components/BookTable';
import { auth } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

export default async function UserReport() {
  const session = await auth();
  const settings = await prisma.setting.findUnique({
    where: {
      id: 'settings',
    },
  });

  const data = await prisma.orderItem.groupBy({
    where: {
      consolidation: {
        AND: [
          {
            userId: session?.user?.id,
          },
          {
            session: settings?.currentSession || '',
          },
        ],
      },
    },
    by: ['productName'],
    _sum: { quantity: true },
  });

  // const data = (
  //   await db.order.findMany({
  //     include: {
  //       items: true,
  //     },
  //   })
  // ).filter(
  //   (item) =>
  //     item.items.length === 1 && item.items[0].productName.includes('Telling')
  // );

  return (
    <main className='px-4 lg:px-6 py-4'>
      <BookTable
        data={
          data as {
            productName: string;
            _sum: {
              quantity: number;
            };
          }[]
        }
      />
    </main>
  );
}
