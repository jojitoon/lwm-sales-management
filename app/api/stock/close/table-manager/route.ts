import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

export async function POST(request: Request) {
  return auth(async (req) => {
    try {
      if (!req.auth || !req.auth.user) {
        return NextResponse.json(
          { message: 'Not authenticated' },
          { status: 401 }
        );
      }

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Get table manager's session
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession || '',
          workspace: 'table-manager',
          isActive: true,
        },
        include: {
          tableSaleSession: true,
        },
      });

      if (!mySession?.tableSaleSession) {
        return NextResponse.json(
          { message: 'Table sale session not found' },
          { status: 404 }
        );
      }

      const tableSaleSession = mySession.tableSaleSession;
      const tableStock = (tableSaleSession.data as any)?.list || [];

      // Check if stock is already closed
      const currentData = (tableSaleSession.data as any) || {};
      if (currentData.closingStock) {
        return NextResponse.json(
          { message: 'Stock has already been closed for this table session' },
          { status: 400 }
        );
      }

      // Calculate remaining stock (available items that haven't been sold)
      // Allow closing even if no stock remaining
      const remainingStock = tableStock
        .filter((book: any) => book.available > 0)
        .map((book: any) => ({
          title: book.title,
          quantity: book.available,
          price: book.price,
        }));

      // Find the mini store session that provided this stock
      // We'll find it by looking at approved requests from mini store to this table
      const miniStoreRequest = await prisma.miniStoreRequest.findFirst({
        where: {
          tableSaleSessionId: tableSaleSession.id,
          wasApproved: true,
        },
        include: {
          miniStoreSession: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!miniStoreRequest?.miniStoreSession) {
        return NextResponse.json(
          { message: 'Mini store session not found for this table' },
          { status: 404 }
        );
      }

      const miniStoreSession = miniStoreRequest.miniStoreSession;
      const miniStoreStock = (miniStoreSession.data as any)?.list || [];

      // Return remaining stock to mini store (only if there's stock to return)
      let updatedMiniStoreStock = [...miniStoreStock];
      if (remainingStock.length > 0) {
        updatedMiniStoreStock = miniStoreStock.map((book: any) => {
          const returnedItem = remainingStock.find(
            (item: any) => item.title === book.title
          );
          if (returnedItem) {
            return {
              ...book,
              available: book.available + returnedItem.quantity,
              distributed: Math.max(
                0,
                book.distributed - returnedItem.quantity
              ),
            };
          }
          return book;
        });

        // Add any new books that weren't in mini store stock
        for (const item of remainingStock) {
          const exists = updatedMiniStoreStock.find(
            (book: any) => book.title === item.title
          );
          if (!exists) {
            updatedMiniStoreStock.push({
              title: item.title,
              price: item.price,
              total: item.quantity,
              available: item.quantity,
              distributed: 0,
            });
          }
        }
      }

      // Update mini store stock (only if there's stock to return)
      if (remainingStock.length > 0) {
        await prisma.miniStoreSession.update({
          where: { id: miniStoreSession.id },
          data: {
            data: { list: updatedMiniStoreStock },
          },
        });
      }

      // Save closing stock data to table session
      const closingStockData = {
        closedAt: new Date().toISOString(),
        closedBy: req.auth.user.email,
        remainingStock,
        totalItems: remainingStock.length,
        totalQuantity: remainingStock.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ),
      };

      // Update table sale session with closing data
      await prisma.tableSaleSession.update({
        where: { id: tableSaleSession.id },
        data: {
          data: {
            ...currentData,
            closingStock: closingStockData,
          },
        },
      });

      // Emit WebSocket events
      wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
        sessionId: miniStoreSession.id,
        workspace: 'mini-store',
      });

      wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
        sessionId: tableSaleSession.id,
        workspace: 'table-manager',
      });

      return NextResponse.json({
        message: 'Stock closed successfully',
        closingStock: closingStockData,
      });
    } catch (error) {
      console.error('Error closing table manager stock:', error);
      return NextResponse.json(
        {
          message: 'Internal Server Error. Please try again later.',
        },
        { status: 500 }
      );
    }
  })(request as any, {} as any) as any;
}
