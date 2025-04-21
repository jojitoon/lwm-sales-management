import { LocationServerFilter } from '@/components/LocationServerFilter';
import { OrderItemTable } from '@/components/OrderItemTable';
import { ServerDownload } from '@/components/ServerDownload';
import { prisma } from '@/lib/prisma';

export default async function BookReport({
  searchParams,
}: {
  searchParams?: Promise<{ location: string; isCollected: string }>;
}) {
  const shippingZones = (
    await prisma.preOrder.groupBy({
      by: ['shippingZone'],
    })
  ).map((item) => item.shippingZone as string);

  const location = (await searchParams)?.location;
  const isCollected = (await searchParams)?.isCollected;

  const orders = await prisma.orderItem.findMany({
    where: {
      ...(location && {
        order: {
          shippingZone: location,
        },
      }),
      ...(isCollected && {
        isCollected: isCollected === 'Collected',
      }),
    },
    include: {
      order: true,
    },
  });

  const allData = await Promise.all(
    shippingZones.map(async (locate) => {
      const locationData = await prisma.orderItem.findMany({
        where: {
          order: {
            shippingZone: locate,
          },
          ...(isCollected && {
            isCollected: isCollected === 'Collected',
          }),
        },
        include: {
          order: true,
        },
      });
      return {
        name: locate,
        data: locationData.map((item) => ({
          orderId: item.order.orderNumber,
          email: item.order.email,
          phone: item.order.phoneNumber,
          name: item.order.fullName,
          Book: item.productName,
          quantity: item.quantity,
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
              orderId: item.order.orderNumber,
              email: item.order.email,
              phone: item.order.phoneNumber,
              name: item.order.fullName,
              Book: item.productName,
              quantity: item.quantity,
            }))}
            name={`order_by_location_${location}_${isCollected}.xlsx`}
          />
          <ServerDownload
            label='Download All'
            data={allData}
            name={`order_by_location_all_${isCollected}.xlsx`}
            isMultiple
          />
        </div>
      </div>
      <OrderItemTable data={orders} />
    </main>
  );
}
