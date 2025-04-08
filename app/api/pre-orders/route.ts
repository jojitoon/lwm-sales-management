import { prisma } from '@/lib/prisma';

export async function GET() {
  const orders = await prisma.preOrder.findMany({
    include: {
      items: true,
    },
  });
  return Response.json(orders);
}
