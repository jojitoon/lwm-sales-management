import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
      const miniStoreSessionId = body.miniStoreSessionId;

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: req.auth.user.id },
        select: { isAdmin: true },
      });

      let miniStoreSession;

      if (miniStoreSessionId && user?.isAdmin) {
        // Admin mode: open specific mini store session
        miniStoreSession = await prisma.miniStoreSession.findUnique({
          where: { id: miniStoreSessionId },
        });
      } else {
        // Regular mode: get current user's mini store session
        const mySession = await prisma.mySession.findFirst({
          where: {
            userId: req.auth.user.id,
            session: settings?.currentSession || '',
            workspace: { in: ['mini-store', 'preorder-ministore'] },
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

        miniStoreSession = mySession.miniStoreSession;
      }

      if (!miniStoreSession) {
        return NextResponse.json(
          { message: 'Mini store session not found' },
          { status: 404 }
        );
      }

      // Check if stock is closed
      if (!miniStoreSession.closingStock) {
        return NextResponse.json(
          { message: 'Stock is not closed for this mini store session' },
          { status: 400 }
        );
      }

      // Clear closing stock data from mini store session
      await prisma.miniStoreSession.update({
        where: { id: miniStoreSession.id },
        data: {
          closingStock: null,
          closedAt: null,
        },
      });

      // Emit WebSocket event for mini store
      wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
        sessionId: miniStoreSession.id,
        workspace: 'mini-store',
      });

      return NextResponse.json({
        message: 'Stock opened successfully',
      });
    } catch (error) {
      console.error('Error opening mini store stock:', error);
      return NextResponse.json(
        {
          message: 'Internal Server Error. Please try again later.',
        },
        { status: 500 }
      );
    }
  })(request, {} as any) as any;
}

