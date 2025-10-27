import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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
      const { requestId, approved, grantedQuantity } = await request.json();

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
      const bookTitle = requestData.bookTitle;
      const requestedQuantity = requestData.quantity;

      if (approved) {
        // Check if main store has enough stock
        const mainStoreStock =
          (mainStoreRequest.mainStoreSession.data as any)?.list || [];
        const bookStock = mainStoreStock.find(
          (book: any) => book.title === bookTitle
        );

        if (!bookStock || bookStock.available < requestedQuantity) {
          return NextResponse.json(
            { message: 'Insufficient stock in main store' },
            { status: 400 }
          );
        }

        // Update main store stock
        const updatedMainStoreStock = mainStoreStock.map((book: any) => {
          if (book.title === bookTitle) {
            return {
              ...book,
              available: book.available - requestedQuantity,
              distributed: book.distributed + requestedQuantity,
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

        // Update mini store stock
        const miniStoreStock =
          (mainStoreRequest.miniStoreSession.data as any)?.list || [];
        const existingBookIndex = miniStoreStock.findIndex(
          (book: any) => book.title === bookTitle
        );

        if (existingBookIndex >= 0) {
          miniStoreStock[existingBookIndex] = {
            ...miniStoreStock[existingBookIndex],
            available:
              miniStoreStock[existingBookIndex].available + requestedQuantity,
            total: miniStoreStock[existingBookIndex].total + requestedQuantity,
          };
        } else {
          miniStoreStock.push({
            title: bookTitle,
            price: bookStock.price,
            total: requestedQuantity,
            available: requestedQuantity,
            distributed: 0,
          });
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
          granted: approved ? { quantity: requestedQuantity } : {},
        },
      });

      return NextResponse.json({
        message: approved ? 'Request approved' : 'Request denied',
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
