import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const { sessionType, sessionId } = await request.json();

      if (!sessionType || !sessionId) {
        return NextResponse.json(
          { message: 'Session type and session ID are required' },
          { status: 400 }
        );
      }

      if (!['main-store', 'mini-store'].includes(sessionType)) {
        return NextResponse.json(
          { message: 'Invalid session type. Must be main-store or mini-store' },
          { status: 400 }
        );
      }

      // Check if user is admin
      const isAdmin = (req.auth.user as any)?.isAdmin;
      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Only administrators can close sessions' },
          { status: 403 }
        );
      }

      let session;
      let closingStock;

      if (sessionType === 'main-store') {
        session = await prisma.mainStoreSession.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          return NextResponse.json(
            { message: 'Main store session not found' },
            { status: 404 }
          );
        }

        if (!session.isActive) {
          return NextResponse.json(
            { message: 'Session is already closed' },
            { status: 400 }
          );
        }

        // Capture current stock as closing stock
        closingStock = (session.data as any)?.list || [];

        // Update session with closing stock and close it
        const updatedSession = await prisma.mainStoreSession.update({
          where: { id: sessionId },
          data: {
            closingStock: closingStock,
            closedAt: new Date(),
            isActive: false,
          },
        });

        return NextResponse.json({
          message: 'Main store session closed successfully',
          session: updatedSession,
          closingStock: closingStock,
        });
      } else if (sessionType === 'mini-store') {
        session = await prisma.miniStoreSession.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          return NextResponse.json(
            { message: 'Mini store session not found' },
            { status: 404 }
          );
        }

        if (!session.isActive) {
          return NextResponse.json(
            { message: 'Session is already closed' },
            { status: 400 }
          );
        }

        // Capture current stock as closing stock
        closingStock = (session.data as any)?.list || [];

        // Update session with closing stock and close it
        const updatedSession = await prisma.miniStoreSession.update({
          where: { id: sessionId },
          data: {
            closingStock: closingStock,
            closedAt: new Date(),
            isActive: false,
          },
        });

        return NextResponse.json({
          message: 'Mini store session closed successfully',
          session: updatedSession,
          closingStock: closingStock,
        });
      }
    } catch (error) {
      console.error('Error closing session:', error);
      return NextResponse.json(
        { message: 'Failed to close session' },
        { status: 500 }
      );
    }
  })(request, {});
}
