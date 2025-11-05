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

      // Get the items that are being collected (not already collected)
      const itemsToCollect =
        existingItems > 0
          ? order.items.filter(
              (item) => items.includes(item.id) && !item.isCollected
            )
          : order.items.filter((item) => !item.isCollected);

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

      // Update book quantities for collected items
      for (const item of itemsToCollect) {
        let bookId = item.bookId;

        // If bookId is not set, try to get it from the mapping table
        if (!bookId) {
          const mapping = await prisma.bookMapping.findUnique({
            where: { productName: item.productName },
            select: { bookId: true },
          });
          if (mapping) {
            bookId = mapping.bookId;
            // Update the orderItem with the bookId for future reference
            await prisma.orderItem.update({
              where: { id: item.id },
              data: { bookId },
            });
          }
        }

        // If we have a bookId, update the book quantities
        if (bookId) {
          const book = await prisma.book.findUnique({
            where: { id: bookId },
            select: { preorderAvailable: true, available: true },
          });

          if (book) {
            // Check if there's enough stock before decrementing
            const newPreorderAvailable = book.preorderAvailable - item.quantity;
            const newAvailable = book.available - item.quantity;

            // Prevent negative quantities
            if (newPreorderAvailable >= 0 && newAvailable >= 0) {
              await prisma.book.update({
                where: { id: bookId },
                data: {
                  preorderAvailable: {
                    decrement: item.quantity,
                  },
                  available: {
                    decrement: item.quantity,
                  },
                },
              });
            } else {
              console.warn(
                `Insufficient stock for book ${bookId}. PreorderAvailable: ${book.preorderAvailable}, Available: ${book.available}, Requested: ${item.quantity}`
              );
            }
          }
        }
      }

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
