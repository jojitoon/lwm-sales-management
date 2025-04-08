import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ session: string }> }
) {
  const sessionName = (await params).session;

  const books = await prisma.orderItem.groupBy({
    by: ['productName'],
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
    _sum: { quantity: true },
  });

  return Response.json(books);
}
