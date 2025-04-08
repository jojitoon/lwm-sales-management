import { BookTable } from '@/components/BookTable';
import { LocationServerFilter } from '@/components/LocationServerFilter';
import { ServerDownload } from '@/components/ServerDownload';
import { prisma } from '@/lib/prisma';

export default async function BookLeftReport({
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

  const data = await prisma.orderItem.groupBy({
    where: {
      isCollected: false,
      ...(location
        ? {
            order: {
              shippingZone: location,
            },
          }
        : {
            order: {
              shippingZone: {
                notIn: ['SCC Ogudu', 'SCC Surulere', 'SCC Yaba'],
              },
            },
          }),
    },
    by: ['productName'],
    _sum: { quantity: true },
  });

  const allData = await Promise.all(
    shippingZones.map(async (locate) => {
      const locationData = await prisma.orderItem.groupBy({
        where: {
          isCollected: false,
          order: {
            shippingZone: locate,
          },
        },
        by: ['productName'],
        _sum: { quantity: true },
      });
      return {
        name: locate,
        data: locationData.map((item) => ({
          productName: item.productName,
          quantity: item._sum.quantity,
        })),
      };
    })
  );
  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8 '>
        <h1 className='text-2xl font-bold my-2'>Book Left Reports</h1>
        <div className='flex items-center gap-2'>
          <LocationServerFilter
            location={location || 'All'}
            locations={shippingZones}
          />
          <ServerDownload
            data={data.map((item) => ({
              productName: item.productName,
              quantity: item._sum.quantity,
            }))}
            name={'all-books-left-filtered.xlsx'}
            label='Download'
          />
          <ServerDownload
            data={allData}
            name={'all-books-left.xlsx'}
            isMultiple
            label='Download All'
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
