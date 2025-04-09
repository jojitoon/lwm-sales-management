import { SessionServerFilter } from '@/components/SessionServerFilter';
import { OrderReportTable } from '@/components/OrderReportTable';
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

  const data = await prisma.orderItem.findMany({
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
    include: {
      order: true,
    },
  });

  const session = querySession || settings?.currentSession || '';

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>
          Book Reports -{' '}
          {session === 'All' ? 'All Session' : session?.replace(/_/g, ' ')}
        </h1>

        <SessionServerFilter session={session} />
      </div>

      <OrderReportTable data={data as any[]} />
    </main>
  );
}
