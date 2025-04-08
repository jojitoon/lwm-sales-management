import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orderParam = (await params).id;
  let where: Record<string, string> = { orderNumber: orderParam };
  if (orderParam.includes('@')) {
    where = { email: orderParam };
  } else {
    const order = await prisma.preOrder.findFirst({ where });
    if (!order) {
      return Response.json([]);
    }

    where = { email: order.email };
  }

  const orders = await prisma.preOrder.findMany({
    where,
    include: {
      items: true,
    },
  });

  return Response.json(orders);
}
