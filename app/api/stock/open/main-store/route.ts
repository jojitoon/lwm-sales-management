import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/generated/client';
import { NextRequest, NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

export async function POST(request: NextRequest) {
  return auth(async (req) => {
    try {
      if (!req.auth || !req.auth.user) {
        return NextResponse.json(
          { message: 'Not authenticated' },
          { status: 401 }
        );
      }

      const body = await request.json().catch(() => ({}));
      const mainStoreSessionId = body.mainStoreSessionId;

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: req.auth.user.id },
        select: { isAdmin: true },
      });

      let mainStoreSession;

      if (mainStoreSessionId && user?.isAdmin) {
        // Admin mode: open specific main store session
        mainStoreSession = await prisma.mainStoreSession.findUnique({
          where: { id: mainStoreSessionId },
        });
      } else {
        // Regular mode: get current user's main store session
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

        mainStoreSession = mySession.mainStoreSession;
      }

      if (!mainStoreSession) {
        return NextResponse.json(
          { message: 'Main store session not found' },
          { status: 404 }
        );
      }

      // Check if stock is closed
      if (!mainStoreSession.closingStock) {
        return NextResponse.json(
          { message: 'Stock is not closed for this main store session' },
          { status: 400 }
        );
      }

      const closingStock = mainStoreSession.closingStock as any;

      // Restore distributed stock to main store books (available field only)
      // This reverses the deduction that was made when closing
      // Use distributedPerBook which contains the actual distributed amounts (total - available)
      if (closingStock.distributedPerBook && Array.isArray(closingStock.distributedPerBook)) {
        for (const item of closingStock.distributedPerBook) {
          const book = await prisma.book.findFirst({
            where: { title: item.title, isActive: true },
          });

          if (book) {
            const quantityToRestore = item.distributed || 0;
            await prisma.book.update({
              where: { id: book.id },
              data: {
                available: {
                  increment: quantityToRestore,
                },
              },
            });
          }
        }
      }

      // Clear closing stock data from main store session
      await prisma.mainStoreSession.update({
        where: { id: mainStoreSession.id },
        data: {
          closingStock: Prisma.JsonNull,
          closedAt: null,
        },
      });

      // Emit WebSocket event for main store
      wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
        sessionId: mainStoreSession.id,
        workspace: 'main-store',
      });

      return NextResponse.json({
        message: 'Stock opened successfully',
      });
    } catch (error) {
      console.error('Error opening main store stock:', error);
      return NextResponse.json(
        {
          message: 'Internal Server Error. Please try again later.',
        },
        { status: 500 }
      );
    }
  })(request, {} as any) as any;
}

