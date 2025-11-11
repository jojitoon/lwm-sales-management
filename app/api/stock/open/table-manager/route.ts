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
      const tableSaleSessionId = body.tableSaleSessionId;

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: req.auth.user.id },
        select: { isAdmin: true },
      });

      let tableSaleSession;

      if (tableSaleSessionId && user?.isAdmin) {
        // Admin mode: open specific table sale session
        tableSaleSession = await prisma.tableSaleSession.findUnique({
          where: { id: tableSaleSessionId },
        });
      } else {
        // Regular mode: get current user's table sale session
        const mySession = await prisma.mySession.findFirst({
          where: {
            userId: req.auth.user.id,
            session: settings?.currentSession || '',
            workspace: { in: ['table-manager', 'pre-order'] },
            isActive: true,
          },
          include: {
            tableSaleSession: true,
            preorderSession: {
              include: {
                tableSaleSession: true,
              },
            },
          },
        });

        // For pre-order workspace, get table session from preorderSession
        // For table-manager, use tableSaleSession directly
        let session = mySession?.tableSaleSession;
        
        if (mySession?.workspace === 'pre-order' && mySession?.preorderSession?.tableSaleSession) {
          session = mySession.preorderSession.tableSaleSession;
        }

        if (!session) {
          return NextResponse.json(
            { message: 'Table sale session not found' },
            { status: 404 }
          );
        }

        tableSaleSession = session;
      }

      if (!tableSaleSession) {
        return NextResponse.json(
          { message: 'Table sale session not found' },
          { status: 404 }
        );
      }

      // Check if stock is closed
      const sessionData = (tableSaleSession.data as any) || {};
      if (!sessionData.closingStock) {
        return NextResponse.json(
          { message: 'Stock is not closed for this table session' },
          { status: 400 }
        );
      }

      // Clear closing stock data from table sale session
      const updatedData = {
        ...sessionData,
        closingStock: undefined,
      };
      delete updatedData.closingStock;

      await prisma.tableSaleSession.update({
        where: { id: tableSaleSession.id },
        data: {
          data: updatedData,
        },
      });

      // Emit WebSocket event for table manager
      wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
        sessionId: tableSaleSession.id,
        workspace: 'pre-order',
        tableId: tableSaleSession.tableId,
      });

      return NextResponse.json({
        message: 'Stock opened successfully',
      });
    } catch (error) {
      console.error('Error opening table manager stock:', error);
      return NextResponse.json(
        {
          message: 'Internal Server Error. Please try again later.',
        },
        { status: 500 }
      );
    }
  })(request, {} as any) as any;
}

