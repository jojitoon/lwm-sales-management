import { LocationServerFilter } from '@/components/LocationServerFilter';
import { OrdersReportTable } from '@/components/OrdersReportTable';
import { ServerDownload } from '@/components/ServerDownload';
import { BulkCollectOrdersButton } from '@/components/BulkCollectOrdersButton';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export default async function BookReport({
  searchParams,
}: {
  searchParams?: Promise<{ location: string; isCollected: string }>;
}) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.isAdmin || false;

  const shippingZones = (
    await prisma.preOrder.groupBy({
      by: ['shippingZone'],
    })
  ).map((item) => item.shippingZone as string);
  // .filter((zone): zone is string => zone != null && zone !== '');

  const location = (await searchParams)?.location;
  const isCollected = (await searchParams)?.isCollected;

  const orders = await prisma.preOrder.findMany({
    where: {
      ...(location && {
        shippingZone: location,
      }),
      ...(isCollected && {
        isCollected: isCollected === 'Collected',
      }),
    },
    include: {
      items: true,
    },
  });

  const allData = await Promise.all(
    shippingZones.map(async (locate) => {
      const locationData = await prisma.preOrder.findMany({
        where: {
          shippingZone: locate,
          ...(isCollected && {
            isCollected: isCollected === 'Collected',
          }),
        },
        include: {
          items: true,
        },
      });
      return {
        name: locate || 'Unknown',
        data: locationData.map((item) => ({
          orderId: item.orderNumber || '',
          email: item.email || '',
          phone: item.phoneNumber || '',
          name: item.fullName || '',
          items: item?.items
            ?.map((i: any) => `${i.productName} (${i.quantity})`)
            .join(', '),
          total: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'NGN',
          }).format(item.total),
        })),
      };
    })
  );

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>
          Order By Location -{' '}
          {!location ? 'All locations' : location?.replace(/_/g, ' ')}{' '}
          {!isCollected ? '' : isCollected?.replace(/_/g, ' ')}
        </h1>
        <div className='flex items-center gap-2'>
          <LocationServerFilter
            location={location || 'All'}
            locations={shippingZones}
            otherKeys={['isCollected']}
          />
          <LocationServerFilter
            location={isCollected || 'All'}
            locations={['Collected', 'Not_collected']}
            label='Filter by status'
            keyBy={'isCollected'}
            otherKeys={['location']}
          />
          <ServerDownload
            data={orders.map((item) => ({
              orderId: item.orderNumber,
              email: item.email,
              phone: item.phoneNumber,
              name: item.fullName,
              items: item?.items?.length,
            }))}
            name={`order_by_location_${location}_${isCollected}.xlsx`}
          />
          <ServerDownload
            label='Download All'
            data={allData}
            name={`order_by_location_all_${isCollected}.xlsx`}
            isMultiple
          />
          {isAdmin &&
            location &&
            isCollected === 'Not_collected' &&
            orders.length > 0 && (
              <BulkCollectOrdersButton
                location={location}
                orderCount={orders.length}
              />
            )}
        </div>
      </div>
      <OrdersReportTable data={orders} />
    </main>
  );
}
