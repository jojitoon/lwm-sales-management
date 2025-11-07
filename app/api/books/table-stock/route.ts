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

      // Get current user's table sale session
      // Include pre-order workspace as they also need access to table stock
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession as string,
          workspace: { in: ['table-manager', 'book-sales', 'pre-order'] },
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
      // For table-manager and book-sales, use tableSaleSession directly
      let tableSaleSession = mySession?.tableSaleSession;
      
      if (mySession?.workspace === 'pre-order' && mySession?.preorderSession?.tableSaleSession) {
        tableSaleSession = mySession.preorderSession.tableSaleSession;
      }

      if (!tableSaleSession) {
        return NextResponse.json(
          { message: 'Table sale session not found' },
          { status: 404 }
        );
      }

      const stock = (tableSaleSession.data as any)?.list || [];

      return NextResponse.json(stock);
    } catch (error) {
      console.error('Error fetching table stock:', error);
      return NextResponse.json(
        { message: 'Failed to fetch table stock' },
        { status: 500 }
      );
    }
  })(request, {});
}
