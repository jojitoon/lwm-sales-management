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
      const isAdmin = (req.auth.user as any)?.isAdmin;
      const userId = req.auth.user.id || '';

      // Get current session
      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });
      const currentSession = settings?.currentSession || '';

      // Get user's workspace from their active mySession
      let workspace = 'unknown';
      let tableSaleSessionId: string | null = null;
      let preorderSessionId: string | null = null;

      if (!isAdmin && userId) {
        const mySession = await prisma.mySession.findFirst({
          where: {
            userId: userId,
            session: currentSession,
            isActive: true,
          },
          include: {
            tableSaleSession: true,
            preorderSession: true,
          },
        });

        workspace = mySession?.workspace || 'unknown';
        tableSaleSessionId = mySession?.tableSaleSessionId || null;
        preorderSessionId = mySession?.preorderSessionId || null;
      }

      let dashboardData = {};

      switch (workspace) {
        case 'book-sales':
          dashboardData = await getBookSalesDashboard(tableSaleSessionId);
          break;
        case 'table-manager':
          dashboardData = await getTableManagerDashboard(tableSaleSessionId);
          break;
        case 'pre-order':
          dashboardData = await getPreOrderDashboard(preorderSessionId, userId, currentSession);
          break;
        default:
          // For admin or unknown workspace, return empty data
          dashboardData = {};
      }

      return NextResponse.json({
        workspace,
        data: dashboardData,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return NextResponse.json(
        { message: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }
  })(request, {});
}

async function getBookSalesDashboard(tableSaleSessionId: string | null) {
  if (!tableSaleSessionId) {
    return {
      totalSales: 0,
      totalItems: 0,
      uniqueBooks: 0,
      totalTransactions: 0,
    };
  }

  const bookSales = await prisma.bookSale.findMany({
    where: {
      sessionId: tableSaleSessionId,
    },
    include: {
      items: {
        include: {
          book: true,
        },
      },
    },
  });

  const totalSales = bookSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = bookSales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const uniqueBooks = new Set(
    bookSales.flatMap((sale) => sale.items.map((item) => item.book.title))
  ).size;

  return {
    totalSales,
    totalItems,
    uniqueBooks,
    totalTransactions: bookSales.length,
  };
}

async function getTableManagerDashboard(tableSaleSessionId: string | null) {
  if (!tableSaleSessionId) {
    return {
      totalBooks: 0,
      totalStockValue: 0,
      totalSoldValue: 0,
      totalRemainingValue: 0,
    };
  }

  const tableSaleSession = await prisma.tableSaleSession.findFirst({
    where: {
      id: tableSaleSessionId,
    },
  });

  const stockList = (tableSaleSession?.data as any)?.list || [];

  // Get book sales for this session
  const bookSales = await prisma.bookSale.findMany({
    where: {
      sessionId: tableSaleSessionId,
    },
    include: {
      items: {
        include: {
          book: true,
        },
      },
    },
  });

  // Calculate sold quantities per book
  const soldQuantities: Record<string, number> = {};
  bookSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const bookTitle = item.book.title.trim().toLowerCase();
      soldQuantities[bookTitle] = (soldQuantities[bookTitle] || 0) + item.quantity;
    });
  });

  // Calculate totals
  let totalStockValue = 0;
  let totalSoldValue = 0;
  let totalRemainingValue = 0;

  stockList.forEach((stockItem: any) => {
    const stockTitle = (stockItem.title || '').trim().toLowerCase();
    const soldQuantity = soldQuantities[stockTitle] || 0;
    const totalStocksReceived = stockItem.total || stockItem.quantity || 0;
    const remainingStock = totalStocksReceived - soldQuantity;
    const unitPrice = stockItem.price || 0;

    totalStockValue += totalStocksReceived * unitPrice;
    totalSoldValue += soldQuantity * unitPrice;
    totalRemainingValue += remainingStock * unitPrice;
  });

  return {
    totalBooks: stockList.length,
    totalStockValue,
    totalSoldValue,
    totalRemainingValue,
  };
}

async function getPreOrderDashboard(
  preorderSessionId: string | null,
  userId: string,
  currentSession: string
) {
  // Get consolidations for the current user and session
  const consolidations = await prisma.consolidation.findMany({
    where: {
      userId: userId,
      session: currentSession,
    },
    include: {
      items: true,
      order: true,
    },
  });

  const totalOrders = consolidations.length;
  const totalItems = consolidations.reduce(
    (sum, cons) => sum + cons.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const totalValue = consolidations.reduce(
    (sum, cons) => sum + cons.items.reduce((itemSum, item) => itemSum + item.quantity * (item.price || 0), 0),
    0
  );

  // Count collected vs pending
  const collectedOrders = consolidations.filter((cons) => cons.order?.isCollected).length;
  const pendingOrders = totalOrders - collectedOrders;

  return {
    totalOrders,
    totalItems,
    totalValue,
    collectedOrders,
    pendingOrders,
  };
}

