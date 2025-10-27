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
      const bookTitle = requestData.bookTitle;
      const requestedQuantity = requestData.quantity;

      console.log('Processing mini store request approval:', {
        requestId,
        bookTitle,
        requestedQuantity,
        approved,
        tableSaleSessionId: miniStoreRequest.tableSaleSessionId,
      });

      if (approved) {
        // Check if mini store has enough stock
        const miniStoreStock =
          (miniStoreRequest.miniStoreSession.data as any)?.list || [];
        const bookStock = miniStoreStock.find(
          (book: any) => book.title === bookTitle
        );

        if (!bookStock || bookStock.available < requestedQuantity) {
          return NextResponse.json(
            { message: 'Insufficient stock in mini store' },
            { status: 400 }
          );
        }

        // Update mini store stock
        const updatedMiniStoreStock = miniStoreStock.map((book: any) => {
          if (book.title === bookTitle) {
            return {
              ...book,
              available: book.available - requestedQuantity,
              distributed: book.distributed + requestedQuantity,
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

        // Update table sale stock
        const tableSaleStock =
          (miniStoreRequest.tableSaleSession?.data as any)?.list || [];
        const existingBookIndex = tableSaleStock.findIndex(
          (book: any) => book.title === bookTitle
        );

        console.log('Table sale stock before update:', {
          tableSaleStock,
          bookTitle,
          existingBookIndex,
          requestedQuantity,
        });

        if (existingBookIndex >= 0) {
          tableSaleStock[existingBookIndex] = {
            ...tableSaleStock[existingBookIndex],
            available:
              tableSaleStock[existingBookIndex].available + requestedQuantity,
            total: tableSaleStock[existingBookIndex].total + requestedQuantity,
          };
        } else {
          tableSaleStock.push({
            title: bookTitle,
            price: bookStock.price,
            total: requestedQuantity,
            available: requestedQuantity,
            distributed: 0,
          });
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
          granted: approved ? { quantity: requestedQuantity } : {},
        },
      });

      return NextResponse.json({
        message: approved ? 'Request approved' : 'Request denied',
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
