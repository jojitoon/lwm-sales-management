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
      const { searchParams } = new URL(request.url);
      const sessionType = searchParams.get('type');
      const sessionName = searchParams.get('session');

      if (!sessionType || !['main-store', 'mini-store'].includes(sessionType)) {
        return NextResponse.json(
          {
            message:
              'Valid session type (main-store or mini-store) is required',
          },
          { status: 400 }
        );
      }

      let sessions;

      if (sessionType === 'main-store') {
        sessions = await prisma.mainStoreSession.findMany({
          where: sessionName
            ? { session: sessionName, isActive: false }
            : { isActive: false },
          select: {
            id: true,
            name: true,
            session: true,
            managerId: true,
            closingStock: true,
            closedAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            closedAt: 'desc',
          },
        });
      } else {
        sessions = await prisma.miniStoreSession.findMany({
          where: sessionName
            ? { session: sessionName, isActive: false }
            : { isActive: false },
          select: {
            id: true,
            session: true,
            managerId: true,
            closingStock: true,
            closedAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            closedAt: 'desc',
          },
        });
      }

      // Transform sessions to include closing stock summary
      const sessionsWithSummary = sessions.map((session) => {
        const closingStock = (session.closingStock as any) || [];
        const totalBooks = closingStock.length;
        const totalQuantity = closingStock.reduce(
          (sum: number, book: any) => sum + (book.available || 0),
          0
        );
        const totalValue = closingStock.reduce(
          (sum: number, book: any) =>
            sum + (book.price || 0) * (book.available || 0),
          0
        );

        return {
          ...session,
          closingStockSummary: {
            totalBooks,
            totalQuantity,
            totalValue,
            books: closingStock,
          },
        };
      });

      return NextResponse.json({
        sessions: sessionsWithSummary,
        totalSessions: sessionsWithSummary.length,
      });
    } catch (error) {
      console.error('Error fetching closing stock data:', error);
      return NextResponse.json(
        { message: 'Failed to fetch closing stock data' },
        { status: 500 }
      );
    }
  })(request, {});
}
