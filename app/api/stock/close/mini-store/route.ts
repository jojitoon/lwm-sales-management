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

      // Get mini store session
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession || '',
          workspace: 'mini-store',
          isActive: true,
        },
        include: {
          miniStoreSession: true,
        },
      });

      if (!mySession?.miniStoreSession) {
        return NextResponse.json(
          { message: 'Mini store session not found' },
          { status: 404 }
        );
      }

      const miniStoreSession = mySession.miniStoreSession;
      const miniStoreStock = (miniStoreSession.data as any)?.list || [];

      // Check if stock is already closed
      if (miniStoreSession.closingStock) {
        return NextResponse.json(
          { message: 'Stock has already been closed for this mini store session' },
          { status: 400 }
        );
      }

      // Check if all table sessions that received stock have closed their sessions
      const approvedRequests = await prisma.miniStoreRequest.findMany({
        where: {
          miniStoreSessionId: miniStoreSession.id,
          wasApproved: true,
          tableSaleSessionId: { not: null },
        },
        include: {
          tableSaleSession: {
            select: {
              id: true,
              tableId: true,
              name: true,
              data: true,
            },
          },
        },
      });

      // Find table sessions that haven't closed yet
      const unclosedTables = approvedRequests
        .filter((req) => {
          if (!req.tableSaleSession) return false;
          const tableData = req.tableSaleSession.data as any;
          return !tableData?.closingStock;
        })
        .map((req) => ({
          tableId: req.tableSaleSession?.tableId || 'Unknown',
          name: req.tableSaleSession?.name || 'Unknown',
        }));

      if (unclosedTables.length > 0) {
        return NextResponse.json(
          {
            message: 'Cannot close stock. The following tables have not closed their sessions yet:',
            unclosedTables: unclosedTables.map((t) => `${t.name} (${t.tableId})`).join(', '),
            unclosedTableDetails: unclosedTables,
          },
          { status: 400 }
        );
      }

      // Calculate remaining stock (available items that haven't been distributed)
      // Allow closing even if no stock remaining
      const remainingStock = miniStoreStock
        .filter((book: any) => book.available > 0)
        .map((book: any) => ({
          title: book.title,
          quantity: book.available,
          price: book.price,
        }));

      // Find the main store session that provided this stock
      const mainStoreRequest = await prisma.mainStoreRequest.findFirst({
        where: {
          miniStoreSessionId: miniStoreSession.id,
          wasApproved: true,
        },
        include: {
          mainStoreSession: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Return stock to main store if there's a main store request
      if (mainStoreRequest?.mainStoreSession) {
        const mainStoreSession = mainStoreRequest.mainStoreSession;
        const mainStoreStock = (mainStoreSession.data as any)?.list || [];

        // Return remaining stock to main store (only if there's stock to return)
        if (remainingStock.length > 0) {
          let updatedMainStoreStock = mainStoreStock.map((book: any) => {
            const returnedItem = remainingStock.find(
              (item: any) => item.title === book.title
            );
            if (returnedItem) {
              return {
                ...book,
                available: book.available + returnedItem.quantity,
                distributed: Math.max(0, book.distributed - returnedItem.quantity),
              };
            }
            return book;
          });

          // Add any new books that weren't in main store stock
          for (const item of remainingStock) {
            const exists = updatedMainStoreStock.find(
              (book: any) => book.title === item.title
            );
            if (!exists) {
              updatedMainStoreStock.push({
                title: item.title,
                price: item.price,
                total: item.quantity,
                available: item.quantity,
                distributed: 0,
              });
            }
          }

          // Update main store stock
          await prisma.mainStoreSession.update({
            where: { id: mainStoreSession.id },
            data: {
              data: { list: updatedMainStoreStock },
            },
          });

          // Emit WebSocket event for main store
          wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
            sessionId: mainStoreSession.id,
            workspace: 'main-store',
          });
        }
      }

      // Save closing stock data to mini store session
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

      // Update mini store session with closing data
      await prisma.miniStoreSession.update({
        where: { id: miniStoreSession.id },
        data: {
          closingStock: closingStockData,
          closedAt: new Date(),
        },
      });

      // Emit WebSocket event for mini store
      wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
        sessionId: miniStoreSession.id,
        workspace: 'mini-store',
      });

      return NextResponse.json({
        message: 'Stock closed successfully',
        closingStock: closingStockData,
      });
    } catch (error) {
      console.error('Error closing mini store stock:', error);
      return NextResponse.json(
        {
          message: 'Internal Server Error. Please try again later.',
        },
        { status: 500 }
      );
    }
  })(request as any, {} as any) as any;
}

