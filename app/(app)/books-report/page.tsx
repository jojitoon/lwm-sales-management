import { BookTable } from '@/components/BookTable';
import { SessionServerFilter } from '@/components/SessionServerFilter';
import { ServerDownload } from '@/components/ServerDownload';
import { prisma } from '@/lib/prisma';

export default async function BookReport({
  searchParams,
}: {
  searchParams?: Promise<{ session: string }>;
}) {
  const querySession = (await searchParams)?.session;
  const settings = await prisma.setting.findUnique({
    where: {
      id: 'settings',
    },
  });
  const isAll = querySession === 'All';

  const data = await prisma.orderItem.groupBy({
    where: {
      ...(!isAll
        ? {
            consolidation: {
              session: querySession || settings?.currentSession || '',
            },
          }
        : {
            consolidationId: {
              not: null,
            },
          }),
    },
    by: ['productName'],
    _sum: { quantity: true },
  });

  const session = querySession || settings?.currentSession || '';

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>
          Book Reports -{' '}
          {session === 'All' ? 'All Session' : session?.replace(/_/g, ' ')}
        </h1>

        <div className='flex items-center gap-4'>
          <SessionServerFilter session={session} />
          <ServerDownload
            data={data.map((item) => ({
              productName: item.productName,
              quantity: item._sum?.quantity || 0,
            }))}
            name={'books-sold.xlsx'}
            // isMultiple
          />
        </div>
      </div>

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
