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

      const requests = await prisma.mainStoreRequest.findMany({
        where: {
          mainStoreSession: {
            session: settings?.currentSession as string,
          },
        },
        include: {
          mainStoreSession: true,
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

export async function POST(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const requestBody = await request.json();
      let items;

      // Check if it's the new format with items array
      if (requestBody.items && Array.isArray(requestBody.items)) {
        items = requestBody.items;

        if (items.length === 0) {
          return NextResponse.json(
            { message: 'No items provided' },
            { status: 400 }
          );
        }

        // Validate each item
        for (const item of items) {
          if (!item.bookTitle || !item.quantity || item.quantity <= 0) {
            return NextResponse.json(
              {
                message:
                  'Invalid item data. Each item must have bookTitle and quantity > 0',
              },
              { status: 400 }
            );
          }
        }
      } else {
        // Fallback to old format for backward compatibility
        const { bookTitle, quantity } = requestBody;

        if (!bookTitle || !quantity || quantity <= 0) {
          return NextResponse.json(
            { message: 'Invalid request data' },
            { status: 400 }
          );
        }

        // Convert old format to new format
        items = [{ bookTitle, quantity }];
      }

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Get current user's mini store session
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession as string,
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

      // Get main store session
      const mainStore = await prisma.mainStoreSession.findFirst({
        where: {
          session: settings?.currentSession as string,
          isActive: true,
        },
      });

      if (!mainStore) {
        return NextResponse.json(
          { message: 'Main store session not found' },
          { status: 404 }
        );
      }

      // Create request data with multiple items
      const requestData = {
        items,
        requestedBy: req.auth.user.email,
        requestedAt: new Date().toISOString(),
        totalItems: items.length,
        totalQuantity: items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ),
      };

      const newRequest = await prisma.mainStoreRequest.create({
        data: {
          mainStoreSessionId: mainStore.id,
          miniStoreSessionId: mySession.miniStoreSession.id,
          request: requestData,
          granted: {},
        },
      });

      // Emit WebSocket event
      wsEmitter.emit(WebSocketEvents.REQUEST_CREATED, {
        requestId: newRequest.id,
        type: 'main-store',
        mainStoreSessionId: mainStore.id,
        miniStoreSessionId: mySession.miniStoreSession.id,
        items: items.map((item: any) => ({
          bookTitle: item.bookTitle,
          quantity: item.quantity,
        })),
        totalItems: items.length,
        totalQuantity: requestData.totalQuantity,
      });

      return NextResponse.json({
        message: `Request sent successfully for ${items.length} item${
          items.length > 1 ? 's' : ''
        }`,
        request: newRequest,
        itemsCount: items.length,
        totalQuantity: requestData.totalQuantity,
      });
    } catch (error) {
      console.error('Error creating main store request:', error);
      return NextResponse.json(
        { message: 'Failed to create request' },
        { status: 500 }
      );
    }
  })(request, {});
}
