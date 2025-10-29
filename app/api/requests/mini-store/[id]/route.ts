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

      // Get mini store requests
      const requests = await prisma.miniStoreRequest.findMany({
        where: {
          miniStoreSession: {
            session: settings?.currentSession as string,
            isActive: true,
          },
        },
        include: {
          tableSaleSession: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(requests);
    } catch (error) {
      console.error('Error fetching mini store requests:', error);
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
      const { requestId, approved, grantedQuantity } = await request.json();

      if (!requestId || typeof approved !== 'boolean') {
        return NextResponse.json(
          { message: 'Invalid request data' },
          { status: 400 }
        );
      }

      const miniStoreRequest = await prisma.miniStoreRequest.findUnique({
        where: { id: requestId },
        include: {
          miniStoreSession: true,
          tableSaleSession: true,
        },
      });

      if (!miniStoreRequest) {
        return NextResponse.json(
          { message: 'Request not found' },
          { status: 404 }
        );
      }

      const requestData = miniStoreRequest.request as any;
      let items: any[] = [];

      // Handle new format with multiple items
      if (requestData.items && Array.isArray(requestData.items)) {
        items = requestData.items;
      } else {
        // Fallback for old format (single item)
        items = [
          { bookTitle: requestData.bookTitle, quantity: requestData.quantity },
        ];
      }

      console.log('Processing mini store request approval:', {
        requestId,
        items,
        approved,
        tableSaleSessionId: miniStoreRequest.tableSaleSessionId,
      });

      if (approved) {
        // Check if mini store has enough stock for all items
        const miniStoreStock =
          (miniStoreRequest.miniStoreSession.data as any)?.list || [];

        for (const item of items) {
          const bookStock = miniStoreStock.find(
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

        // Update mini store stock for all items
        const updatedMiniStoreStock = miniStoreStock.map((book: any) => {
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

        await prisma.miniStoreSession.update({
          where: { id: miniStoreRequest.miniStoreSessionId },
          data: {
            data: { list: updatedMiniStoreStock },
          },
        });

        // Update table sale stock for all items
        const tableSaleStock =
          (miniStoreRequest.tableSaleSession?.data as any)?.list || [];

        for (const item of items) {
          const existingBookIndex = tableSaleStock.findIndex(
            (book: any) => book.title === item.bookTitle
          );

          console.log('Processing item:', {
            bookTitle: item.bookTitle,
            quantity: item.quantity,
            existingBookIndex,
          });

          if (existingBookIndex >= 0) {
            tableSaleStock[existingBookIndex] = {
              ...tableSaleStock[existingBookIndex],
              available:
                tableSaleStock[existingBookIndex].available + item.quantity,
              total: tableSaleStock[existingBookIndex].total + item.quantity,
            };
          } else {
            const bookStock = miniStoreStock.find(
              (book: any) => book.title === item.bookTitle
            );
            tableSaleStock.push({
              title: item.bookTitle,
              price: bookStock.price,
              total: item.quantity,
              available: item.quantity,
              distributed: 0,
            });
          }
        }

        console.log('Table sale stock after update:', tableSaleStock);

        if (miniStoreRequest.tableSaleSession) {
          const updatedSession = await prisma.tableSaleSession.update({
            where: { id: miniStoreRequest.tableSaleSessionId! },
            data: {
              data: { list: tableSaleStock },
            },
          });
          console.log('Table sale session updated:', updatedSession.id);
        } else {
          console.error(
            'Table sale session not found in request:',
            miniStoreRequest.id
          );
          return NextResponse.json(
            { message: 'Table sale session not found in request' },
            { status: 400 }
          );
        }
      }

      // Update request status
      const updatedRequest = await prisma.miniStoreRequest.update({
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
          type: 'mini-store',
          miniStoreSessionId: updatedRequest.miniStoreSessionId,
          tableSaleSessionId: updatedRequest.tableSaleSessionId,
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
          miniStoreSessionId: updatedRequest.miniStoreSessionId,
          tableSaleSessionId: updatedRequest.tableSaleSessionId,
          workspace: 'mini-store',
        });
      } else {
        wsEmitter.emit(WebSocketEvents.REQUEST_DENIED, {
          requestId: updatedRequest.id,
          type: 'mini-store',
          miniStoreSessionId: updatedRequest.miniStoreSessionId,
          tableSaleSessionId: updatedRequest.tableSaleSessionId,
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
      console.error('Error updating mini store request:', error);
      return NextResponse.json(
        { message: 'Failed to update request' },
        { status: 500 }
      );
    }
  })(request, {});
}
