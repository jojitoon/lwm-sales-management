import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return auth(async (req) => {
    try {
      if (!req.auth || !req.auth.user) {
        return NextResponse.json(
          { message: 'Not authenticated' },
          { status: 401 }
        );
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: req.auth.user.id },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        return NextResponse.json(
          { message: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { location } = body;

      if (!location) {
        return NextResponse.json(
          { message: 'Location is required' },
          { status: 400 }
        );
      }

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Find all orders for this location that are not collected
      const ordersToCollect = await prisma.preOrder.findMany({
        where: {
          shippingZone: location,
          isCollected: false,
        },
        include: {
          items: {
            where: {
              isCollected: false,
            },
          },
        },
      });

      if (ordersToCollect.length === 0) {
        return NextResponse.json(
          { message: 'No uncollected orders found for this location' },
          { status: 404 }
        );
      }

      // Create a consolidation for all orders
      const consolidation = await prisma.consolidation.create({
        data: {
          userId: req.auth.user.id,
          session: settings?.currentSession || '',
          date: new Date(),
        },
      });

      // Get all order item IDs that need to be marked as collected
      const orderItemIds: string[] = [];
      for (const order of ordersToCollect) {
        for (const item of order.items) {
          orderItemIds.push(item.id);
        }
      }

      // Mark all order items as collected
      if (orderItemIds.length > 0) {
        await prisma.orderItem.updateMany({
          where: {
            id: {
              in: orderItemIds,
            },
          },
          data: {
            isCollected: true,
            consolidationId: consolidation.id,
          },
        });
      }

      // Update all orders to mark as collected
      const orderIds = ordersToCollect.map((order) => order.id);
      await prisma.preOrder.updateMany({
        where: {
          id: {
            in: orderIds,
          },
        },
        data: {
          isCollected: true,
          isPartiallyCollected: false,
        },
      });

      return NextResponse.json({
        message: `Successfully marked ${ordersToCollect.length} order(s) and ${orderItemIds.length} item(s) as collected for location ${location}`,
        ordersCollected: ordersToCollect.length,
        itemsCollected: orderItemIds.length,
      });
    } catch (error: any) {
      console.error('Error bulk collecting orders by location:', error);
      return NextResponse.json(
        { message: 'Failed to mark orders as collected', error: error.message },
        { status: 500 }
      );
    }
  })(request, {});
}

