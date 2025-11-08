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

      // Get user's workspace to filter by mini store type
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession as string,
          workspace: { in: ['mini-store', 'preorder-ministore'] },
          isActive: true,
        },
        include: {
          miniStoreSession: true,
        },
      });

      const miniStoreType = mySession?.miniStoreSession?.type || null;

      const whereClause: any = {
        miniStoreSession: {
          session: settings?.currentSession as string,
        },
      };

      // If user is from a mini store, only show requests for their store type
      if (miniStoreType) {
        whereClause.miniStoreSession.type = miniStoreType;
      }

      const requests = await prisma.miniStoreRequest.findMany({
        where: whereClause,
        include: {
          miniStoreSession: true,
          tableSaleSession: true,
          preorderSession: true,
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

      // Get current user's table sale session
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession as string,
          workspace: 'table-manager', // Changed from 'table-sale' to 'table-manager'
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

      // Check if stock is closed
      const sessionData = (mySession.tableSaleSession.data as any) || {};
      if (sessionData.closingStock) {
        return NextResponse.json(
          {
            message:
              'Stock has been closed for this table session. No new stock requests can be made.',
          },
          { status: 400 }
        );
      }

      // Check table type to determine which mini store to request from
      const tableType = (mySession.tableSaleSession.data as any)?.tableType || '';
      const isPreorderTable = tableType?.toLowerCase() === 'preorder';

      // Get mini store session based on table type
      // Preorder tables request from preorder ministore, others from regular mini store
      const miniStore = await prisma.miniStoreSession.findFirst({
        where: {
          session: settings?.currentSession as string,
          isActive: true,
          type: isPreorderTable ? 'preorder' : 'regular',
        },
      });

      if (!miniStore) {
        return NextResponse.json(
          { message: `${isPreorderTable ? 'Preorder ' : ''}Mini store session not found` },
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

      const newRequest = await prisma.miniStoreRequest.create({
        data: {
          miniStoreSessionId: miniStore.id,
          tableSaleSessionId: mySession.tableSaleSession.id,
          request: requestData,
          granted: {},
        },
      });

      // Emit WebSocket event
      wsEmitter.emit(WebSocketEvents.REQUEST_CREATED, {
        requestId: newRequest.id,
        type: 'mini-store',
        miniStoreSessionId: miniStore.id,
        tableSaleSessionId: mySession.tableSaleSession.id,
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
      console.error('Error creating mini store request:', error);
      return NextResponse.json(
        { message: 'Failed to create request' },
        { status: 500 }
      );
    }
  })(request, {});
}
