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

      // Get main store session
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession || '',
          workspace: 'main-store',
          isActive: true,
        },
        include: {
          mainStoreSession: true,
        },
      });

      if (!mySession?.mainStoreSession) {
        return NextResponse.json(
          { message: 'Main store session not found' },
          { status: 404 }
        );
      }

      const mainStoreSession = mySession.mainStoreSession;
      const mainStoreStock = (mainStoreSession.data as any)?.list || [];

      // Check if stock is already closed
      if (mainStoreSession.closingStock) {
        return NextResponse.json(
          { message: 'Stock has already been closed for this main store session' },
          { status: 400 }
        );
      }

      // Check if all mini store sessions that received stock have closed their sessions
      const approvedRequests = await prisma.mainStoreRequest.findMany({
        where: {
          mainStoreSessionId: mainStoreSession.id,
          wasApproved: true,
        },
        include: {
          miniStoreSession: {
            select: {
              id: true,
              closingStock: true,
            },
          },
        },
      });

      // Filter out requests without miniStoreSessionId in JavaScript
      const validRequests = approvedRequests.filter(
        (req) => req.miniStoreSessionId !== null
      );

      // Find mini store sessions that haven't closed yet
      const unclosedMiniStores = validRequests
        .filter((req) => {
          if (!req.miniStoreSession) return false;
          return !req.miniStoreSession.closingStock;
        })
        .map((req) => ({
          miniStoreId: req.miniStoreSessionId || 'Unknown',
        }));

      if (unclosedMiniStores.length > 0) {
        return NextResponse.json(
          {
            message: 'Cannot close stock. The following mini stores have not closed their sessions yet:',
            unclosedMiniStores: unclosedMiniStores.map((ms) => `Mini Store ${ms.miniStoreId}`).join(', '),
            unclosedMiniStoreDetails: unclosedMiniStores,
          },
          { status: 400 }
        );
      }

      // Calculate remaining stock (available items that haven't been distributed)
      // Allow closing even if no stock remaining
      const remainingStock = mainStoreStock
        .filter((book: any) => book.available > 0)
        .map((book: any) => ({
          title: book.title,
          quantity: book.available,
          price: book.price,
        }));

      // Get all distributed stock for this session (books given to mini stores)
      const allDistributedStock: Array<{
        title: string;
        quantity: number;
        price: number;
        miniStoreId: string;
      }> = [];

      for (const request of validRequests) {
        const requestData = request.request as any;
        const items = requestData.items || [];
        items.forEach((item: any) => {
          allDistributedStock.push({
            title: item.bookTitle,
            quantity: item.quantity || 0,
            price: item.price || 0,
            miniStoreId: request.miniStoreSessionId,
          });
        });
      }

      // Aggregate distributed stock by book title
      const distributedByBook: Record<
        string,
        { quantity: number; price: number; miniStores: string[] }
      > = {};

      allDistributedStock.forEach((item) => {
        if (!distributedByBook[item.title]) {
          distributedByBook[item.title] = {
            quantity: 0,
            price: item.price,
            miniStores: [],
          };
        }
        distributedByBook[item.title].quantity += item.quantity;
        if (!distributedByBook[item.title].miniStores.includes(item.miniStoreId)) {
          distributedByBook[item.title].miniStores.push(item.miniStoreId);
        }
      });

      // Get all returned stock (from mini store closings)
      const allReturnedStock: Array<{
        title: string;
        quantity: number;
        price: number;
        miniStoreId: string;
      }> = [];

      for (const request of validRequests) {
        if (request.miniStoreSession?.closingStock) {
          const closingStock = request.miniStoreSession.closingStock as any;
          if (closingStock.remainingStock) {
            closingStock.remainingStock.forEach((item: any) => {
              allReturnedStock.push({
                title: item.title,
                quantity: item.quantity || 0,
                price: item.price || 0,
                miniStoreId: request.miniStoreSessionId,
              });
            });
          }
        }
      }

      // Aggregate returned stock by book title
      const returnedByBook: Record<
        string,
        { quantity: number; price: number; miniStores: string[] }
      > = {};

      allReturnedStock.forEach((item) => {
        if (!returnedByBook[item.title]) {
          returnedByBook[item.title] = {
            quantity: 0,
            price: item.price,
            miniStores: [],
          };
        }
        returnedByBook[item.title].quantity += item.quantity;
        if (!returnedByBook[item.title].miniStores.includes(item.miniStoreId)) {
          returnedByBook[item.title].miniStores.push(item.miniStoreId);
        }
      });

      // Calculate distributed amounts per book (total - available) for restoration
      const distributedPerBook: Array<{ title: string; distributed: number }> = [];
      for (const bookStock of mainStoreStock) {
        const distributed = (bookStock.total || 0) - (bookStock.available || 0);
        if (distributed > 0) {
          distributedPerBook.push({
            title: bookStock.title,
            distributed: distributed,
          });
        }
      }

      // Save closing stock data to main store session
      const closingStockData = {
        closedAt: new Date().toISOString(),
        closedBy: req.auth.user.email,
        remainingStock,
        totalItems: remainingStock.length,
        totalQuantity: remainingStock.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ),
        distributedStock: Object.entries(distributedByBook).map(
          ([title, data]) => ({
            title,
            quantity: data.quantity,
            price: data.price,
            miniStores: data.miniStores,
          })
        ),
        distributedPerBook, // Store distributed amounts for restoration
        returnedStock: Object.entries(returnedByBook).map(([title, data]) => ({
          title,
          quantity: data.quantity,
          price: data.price,
          miniStores: data.miniStores,
        })),
        totalDistributed: Object.values(distributedByBook).reduce(
          (sum, book) => sum + book.quantity,
          0
        ),
        totalReturned: Object.values(returnedByBook).reduce(
          (sum, book) => sum + book.quantity,
          0
        ),
      };

      // Deduct distributed stock from main store books (available field only)
      // Distributed = total - available for each book in the main store session
      // This distributed amount should be deducted from the available in the books table
      for (const bookStock of mainStoreStock) {
        const distributed = (bookStock.total || 0) - (bookStock.available || 0);
        
        if (distributed > 0) {
          const book = await prisma.book.findFirst({
            where: { title: bookStock.title, isActive: true },
          });

          if (book) {
            const newAvailable = Math.max(0, book.available - distributed);

            await prisma.book.update({
              where: { id: book.id },
              data: {
                available: newAvailable,
              },
            });
          }
        }
      }

      // Update main store session with closing data
      await prisma.mainStoreSession.update({
        where: { id: mainStoreSession.id },
        data: {
          closingStock: closingStockData,
          closedAt: new Date(),
        },
      });

      // Emit WebSocket event for main store
      wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
        sessionId: mainStoreSession.id,
        workspace: 'main-store',
      });

      return NextResponse.json({
        message: 'Stock closed successfully',
        closingStock: closingStockData,
      });
    } catch (error) {
      console.error('Error closing main store stock:', error);
      return NextResponse.json(
        {
          message: 'Internal Server Error. Please try again later.',
        },
        { status: 500 }
      );
    }
  })(request as any, {} as any) as any;
}

