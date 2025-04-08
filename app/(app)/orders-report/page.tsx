import { OrderItemTable } from '@/components/OrderItemTable';
import { ServerDownload } from '@/components/ServerDownload';
import { prisma } from '@/lib/prisma';

export default async function OrderReport() {
  const orders = await prisma.orderItem.findMany({
    include: {
      order: true,
    },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Orders Report</h1>
        <div className='flex items-center gap-2'>
          <ServerDownload
            data={orders.map((item) => ({
              orderId: item.order.orderNumber,
              email: item.order.email,
              phone: item.order.phoneNumber,
              name: item.order.fullName,
              Book: item.productName,
              quantity: item.quantity,
              status: item.isCollected ? 'Collected' : 'Not collected',
              shippingZone: item.order.shippingZone,
            }))}
            name={'full.xlsx'}
          />
        </div>
      </div>
      <OrderItemTable data={orders} />
    </main>
  );
}
