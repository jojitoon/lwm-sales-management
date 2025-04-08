import { LocationServerFilter } from '@/components/LocationServerFilter';
import { OrderItemTable } from '@/components/OrderItemTable';
import { ServerDownload } from '@/components/ServerDownload';
import { prisma } from '@/lib/prisma';

export default async function BookReport({
  searchParams,
}: {
  searchParams?: Promise<{ isCollected: string }>;
}) {
  const isCollected = (await searchParams)?.isCollected;

  const orders = await prisma.orderItem.findMany({
    ...(isCollected && {
      where: {
        isCollected: isCollected === 'Collected',
      },
    }),
    include: {
      order: true,
    },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>
          Order By Status -{' '}
          {!isCollected ? 'All ' : isCollected?.replace(/_/g, ' ')}
        </h1>
        <div className='flex items-center gap-2'>
          <LocationServerFilter
            location={isCollected || 'All'}
            locations={['Collected', 'Not_collected']}
            label='Filter by status'
            keyBy={'isCollected'}
          />
          <ServerDownload
            data={orders}
            name={`order-status-${isCollected || 'All'}.csv`}
          />
        </div>
      </div>
      <OrderItemTable data={orders} />
    </main>
  );
}
