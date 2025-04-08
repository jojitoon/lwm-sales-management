import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params)?.id;

  return auth(async (req) => {
    try {
      if (!req.auth || !req.auth.user) {
        return NextResponse.json(
          { message: 'Not authenticated' },
          { status: 401 }
        );
      }

      const body = await request.json();

      const currentSession = await prisma.setting.findFirst();

      const items = body.items;

      const order = await prisma.preOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) {
        return Response.json(
          {
            message: `Order with id ${id} not found`,
          },
          {
            status: 404,
          }
        );
      }

      console.log({ items }, order.items.length);

      // return error
      if (order.isCollected) {
        return Response.json(
          {
            message: `Order with id ${id} has already been collected`,
          },
          {
            status: 400,
          }
        );
      }
      const existingItems = await prisma.orderItem.count({
        where: {
          orderId: id,
          isCollected: true,
        },
      });

      const isComplete = existingItems + items.length === order.items.length;

      console.log({ existingItems, isComplete });

      // update order status
      await prisma.preOrder.update({
        where: { id },
        data: { isCollected: !!isComplete, isPartiallyCollected: !isComplete },
      });

      const con = await prisma.consolidation.create({
        data: {
          orderId: id,
          userId: req.auth.user?.id || '',
          session: currentSession?.currentSession || 'SATURDAY_MORNING',
          date: new Date(),
        },
      });

      await prisma.orderItem.updateMany({
        where: {
          orderId: id,
          ...(existingItems > 0
            ? {
                id: {
                  in: items,
                },
              }
            : {}),
        },
        data: { isCollected: true, consolidationId: con.id },
      });

      return Response.json({
        message: `Order with id ${id} has been collected`,
      });
    } catch (error) {
      console.log({ error });

      return Response.json(
        {
          message: 'Internal Server Error. Please try again later.',
        },
        {
          status: 500,
        }
      );
    }
  })(request as any, { id } as any) as any;
}
