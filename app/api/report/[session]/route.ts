import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ session: string }> }
) {
  const sessionName = (await params).session;
  console.log({ sessionName });

  const orders = await prisma.orderItem.findMany({
    where:
      sessionName === 'All'
        ? {
            consolidationId: {
              not: null,
            },
          }
        : {
            consolidation: {
              session: sessionName,
            },
          },
    include: {
      order: true,
    },
  });

  return Response.json(orders);
}
