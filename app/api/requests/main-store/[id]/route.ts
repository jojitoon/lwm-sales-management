import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

export async function GET(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Get main store requests
      const requests = await prisma.mainStoreRequest.findMany({
        where: {
          mainStoreSession: {
            session: settings?.currentSession as string,
            isActive: true,
          },
        },
        include: {
          miniStoreSession: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(requests);
    } catch (error) {
      console.error('Error fetching main store requests:', error);
      return NextResponse.json(
        { message: 'Failed to fetch requests' },
        { status: 500 }
      );
    }
  })(request, {});
}

export async function PATCH(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const { requestId, approved, grantedQuantity, items: providedItems } = await request.json();

      if (!requestId || typeof approved !== 'boolean') {
        return NextResponse.json(
          { message: 'Invalid request data' },
          { status: 400 }
        );
      }

      const mainStoreRequest = await prisma.mainStoreRequest.findUnique({
        where: { id: requestId },
        include: {
          mainStoreSession: true,
          miniStoreSession: true,
        },
      });

      if (!mainStoreRequest) {
        return NextResponse.json(
          { message: 'Request not found' },
          { status: 404 }
        );
      }

      const requestData = mainStoreRequest.request as any;
      let items: any[] = [];

      // If items are provided in the request (from approval dialog), use those
      if (providedItems && Array.isArray(providedItems) && providedItems.length > 0) {
        items = providedItems;
      } else {
        // Otherwise, use items from the original request
        // Handle new format with multiple items
        if (requestData.items && Array.isArray(requestData.items)) {
          items = requestData.items;
        } else {
          // Fallback for old format (single item)
          items = [
            { bookTitle: requestData.bookTitle, quantity: requestData.quantity },
          ];
        }
      }

      if (approved) {
        // Check if main store has enough stock for all items
        const mainStoreStock =
          (mainStoreRequest.mainStoreSession.data as any)?.list || [];

        for (const item of items) {
          const bookStock = mainStoreStock.find(
            (book: any) => book.title === item.bookTitle
          );

          if (!bookStock || bookStock.available < item.quantity) {
            return NextResponse.json(
              {
                message: `Insufficient stock for "${
                  item.bookTitle
                }". Available: ${bookStock?.available || 0}, Requested: ${
                  item.quantity
                }`,
              },
              { status: 400 }
            );
          }
        }

        // Update main store stock for all items
        const updatedMainStoreStock = mainStoreStock.map((book: any) => {
          const item = items.find((i: any) => i.bookTitle === book.title);
          if (item) {
            return {
              ...book,
              available: book.available - item.quantity,
              distributed: book.distributed + item.quantity,
            };
          }
          return book;
        });

        await prisma.mainStoreSession.update({
          where: { id: mainStoreRequest.mainStoreSessionId },
          data: {
            data: { list: updatedMainStoreStock },
          },
        });

        // Update mini store stock for all items
        const miniStoreStock =
          (mainStoreRequest.miniStoreSession.data as any)?.list || [];

        for (const item of items) {
          const existingBookIndex = miniStoreStock.findIndex(
            (book: any) => book.title === item.bookTitle
          );

          if (existingBookIndex >= 0) {
            miniStoreStock[existingBookIndex] = {
              ...miniStoreStock[existingBookIndex],
              available:
                miniStoreStock[existingBookIndex].available + item.quantity,
              total: miniStoreStock[existingBookIndex].total + item.quantity,
            };
          } else {
            const bookStock = mainStoreStock.find(
              (book: any) => book.title === item.bookTitle
            );
            miniStoreStock.push({
              title: item.bookTitle,
              price: bookStock.price,
              total: item.quantity,
              available: item.quantity,
              distributed: 0,
            });
          }
        }

        await prisma.miniStoreSession.update({
          where: { id: mainStoreRequest.miniStoreSessionId },
          data: {
            data: { list: miniStoreStock },
          },
        });
      }

      // Update request status
      const updatedRequest = await prisma.mainStoreRequest.update({
        where: { id: requestId },
        data: {
          wasApproved: approved,
          wasDenied: !approved,
          granted: approved
            ? {
                items: items,
                totalItems: items.length,
                totalQuantity: items.reduce(
                  (sum: number, item: any) => sum + item.quantity,
                  0
                ),
                grantedAt: new Date().toISOString(),
              }
            : {},
        },
      });

      // Emit WebSocket event
      if (approved) {
        wsEmitter.emit(WebSocketEvents.REQUEST_APPROVED, {
          requestId: updatedRequest.id,
          type: 'main-store',
          mainStoreSessionId: updatedRequest.mainStoreSessionId,
          miniStoreSessionId: updatedRequest.miniStoreSessionId,
          items: items.map((item: any) => ({
            bookTitle: item.bookTitle,
            quantity: item.quantity,
          })),
          totalItems: items.length,
          totalQuantity: items.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0
          ),
        });

        wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
          mainStoreSessionId: updatedRequest.mainStoreSessionId,
          miniStoreSessionId: updatedRequest.miniStoreSessionId,
          workspace: 'main-store',
        });
      } else {
        wsEmitter.emit(WebSocketEvents.REQUEST_DENIED, {
          requestId: updatedRequest.id,
          type: 'main-store',
          mainStoreSessionId: updatedRequest.mainStoreSessionId,
          miniStoreSessionId: updatedRequest.miniStoreSessionId,
        });
      }

      return NextResponse.json({
        message: approved
          ? `Request approved for ${items.length} item${
              items.length > 1 ? 's' : ''
            }`
          : 'Request denied',
        request: updatedRequest,
      });
    } catch (error) {
      console.error('Error updating main store request:', error);
      return NextResponse.json(
        { message: 'Failed to update request' },
        { status: 500 }
      );
    }
  })(request, {});
}
