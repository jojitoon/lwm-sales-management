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
      const reportType = searchParams.get('type');
      const session = searchParams.get('session');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const workspace = searchParams.get('workspace') || 'unknown';

      const isAdmin = (req.auth.user as any)?.isAdmin;
      const userId = req.auth.user.id || '';

      // Get current session if not specified
      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });
      const currentSession = session || settings?.currentSession || '';

      // Base date filter
      const dateFilter =
        dateFrom && dateTo
          ? {
              createdAt: {
                gte: new Date(dateFrom),
                lte: new Date(dateTo),
              },
            }
          : {};

      let reportData = {};

      switch (reportType) {
        case 'sales-summary':
          reportData = await getSalesSummary(
            currentSession,
            dateFilter,
            workspace,
            userId,
            isAdmin
          );
          break;
        case 'stock-movement':
          reportData = await getStockMovement(
            currentSession,
            dateFilter,
            workspace,
            userId,
            isAdmin
          );
          break;
        case 'request-status':
          reportData = await getRequestStatus(
            currentSession,
            dateFilter,
            workspace,
            userId,
            isAdmin
          );
          break;
        case 'user-performance':
          reportData = await getUserPerformance(
            currentSession,
            dateFilter,
            workspace,
            userId,
            isAdmin
          );
          break;
        case 'financial-summary':
          reportData = await getFinancialSummary(
            currentSession,
            dateFilter,
            workspace,
            userId,
            isAdmin
          );
          break;
        case 'session-closing':
          reportData = await getSessionClosingData(
            currentSession,
            workspace,
            userId,
            isAdmin
          );
          break;
        default:
          return NextResponse.json(
            { message: 'Invalid report type' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        reportType,
        session: currentSession,
        dateRange: { from: dateFrom, to: dateTo },
        workspace,
        data: reportData,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error generating report:', error);
      return NextResponse.json(
        { message: 'Failed to generate report' },
        { status: 500 }
      );
    }
  })(request, {});
}

async function getSalesSummary(
  session: string,
  dateFilter: any,
  workspace: string,
  userId: string,
  isAdmin: boolean
) {
  const whereClause = {
    ...dateFilter,
    ...(session !== 'All'
      ? {
          consolidation: {
            session: session,
          },
        }
      : {
          consolidationId: {
            not: null,
          },
        }),
    ...(!isAdmin
      ? {
          consolidation: {
            userId: userId,
          },
        }
      : {}),
  };

  const salesData = await prisma.orderItem.findMany({
    where: whereClause,
    include: {
      consolidation: {
        include: {
          user: true,
        },
      },
    },
  });

  const totalSales = salesData.reduce(
    (sum, item) => sum + item.quantity * (item.price || 0),
    0
  );
  const totalItems = salesData.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueBooks = new Set(salesData.map((item) => item.productName)).size;

  // Group by user for admin reports
  const salesByUser = isAdmin
    ? salesData.reduce((acc, item) => {
        const userEmail = item.consolidation?.user?.email || 'Unknown';
        if (!acc[userEmail]) {
          acc[userEmail] = { totalSales: 0, totalItems: 0, books: new Set() };
        }
        acc[userEmail].totalSales += item.quantity * (item.price || 0);
        acc[userEmail].totalItems += item.quantity;
        acc[userEmail].books.add(item.productName);
        return acc;
      }, {} as any)
    : null;

  return {
    totalSales,
    totalItems,
    uniqueBooks,
    totalTransactions: salesData.length,
    salesByUser: salesByUser
      ? Object.entries(salesByUser).map(([email, data]: [string, any]) => ({
          email,
          totalSales: data.totalSales,
          totalItems: data.totalItems,
          uniqueBooks: data.books.size,
        }))
      : null,
    recentSales: salesData.slice(-10).map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * (item.price || 0),
      soldBy: item.consolidation?.user?.email || 'Unknown',
      soldAt: item.createdAt,
    })),
  };
}

async function getStockMovement(
  session: string,
  dateFilter: any,
  workspace: string,
  userId: string,
  isAdmin: boolean
) {
  // Get current stock levels
  const currentStock = await prisma.book.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      total: true,
      available: true,
      price: true,
    },
  });

  // Get sales data for movement analysis
  const salesData = await prisma.orderItem.findMany({
    where: {
      ...dateFilter,
      ...(session !== 'All'
        ? {
            consolidation: {
              session: session,
            },
          }
        : {
            consolidationId: {
              not: null,
            },
          }),
    },
    include: {
      consolidation: true,
    },
  });

  // Calculate stock movement
  const stockMovement = currentStock.map((book) => {
    const soldQuantity = salesData
      .filter((item) => item.productName === book.title)
      .reduce((sum, item) => sum + item.quantity, 0);

    return {
      bookId: book.id,
      title: book.title,
      initialStock: book.total,
      currentStock: book.available,
      soldQuantity,
      remainingStock: book.available,
      price: book.price,
      totalValue: book.available * book.price,
    };
  });

  return {
    totalBooks: currentStock.length,
    totalStockValue: currentStock.reduce(
      (sum, book) => sum + book.available * book.price,
      0
    ),
    lowStockBooks: stockMovement.filter((item) => item.remainingStock < 10),
    stockMovement,
  };
}

async function getRequestStatus(
  session: string,
  dateFilter: any,
  workspace: string,
  userId: string,
  isAdmin: boolean
) {
  const mainStoreRequests = await prisma.mainStoreRequest.findMany({
    where: {
      ...dateFilter,
      mainStoreSession: {
        session: session,
      },
    },
    include: {
      mainStoreSession: true,
      miniStoreSession: true,
    },
  });

  const miniStoreRequests = await prisma.miniStoreRequest.findMany({
    where: {
      ...dateFilter,
      miniStoreSession: {
        session: session,
      },
    },
    include: {
      miniStoreSession: true,
      tableSaleSession: true,
      preorderSession: true,
    },
  });

  const allRequests = [
    ...mainStoreRequests.map((req) => ({ ...req, type: 'main-store' })),
    ...miniStoreRequests.map((req) => ({ ...req, type: 'mini-store' })),
  ];

  const pendingRequests = allRequests.filter(
    (req) => !req.wasApproved && !req.wasDenied
  );
  const approvedRequests = allRequests.filter((req) => req.wasApproved);
  const deniedRequests = allRequests.filter((req) => req.wasDenied);

  return {
    totalRequests: allRequests.length,
    pendingRequests: pendingRequests.length,
    approvedRequests: approvedRequests.length,
    deniedRequests: deniedRequests.length,
    approvalRate:
      allRequests.length > 0
        ? (approvedRequests.length / allRequests.length) * 100
        : 0,
    requests: allRequests.map((req) => ({
      id: req.id,
      type: req.type,
      status: req.wasApproved
        ? 'approved'
        : req.wasDenied
        ? 'denied'
        : 'pending',
      requestedAt: req.createdAt,
      requestData: req.request,
      grantedData: req.granted,
    })),
  };
}

async function getUserPerformance(
  session: string,
  dateFilter: any,
  workspace: string,
  userId: string,
  isAdmin: boolean
) {
  if (!isAdmin) {
    return { message: 'Access denied' };
  }

  const users = await prisma.user.findMany({
    include: {
      mySessions: {
        where: {
          session: session,
          isActive: true,
        },
      },
    },
  });

  const userPerformance = await Promise.all(
    users.map(async (user) => {
      const salesData = await prisma.orderItem.findMany({
        where: {
          ...dateFilter,
          consolidation: {
            userId: user.id,
            session: session,
          },
        },
      });

      const totalSales = salesData.reduce(
        (sum, item) => sum + item.quantity * (item.price || 0),
        0
      );
      const totalItems = salesData.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const uniqueBooks = new Set(salesData.map((item) => item.productName))
        .size;

      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        workspace: user.mySessions[0]?.workspace || 'Unknown',
        totalSales,
        totalItems,
        uniqueBooks,
        transactionCount: salesData.length,
        averageOrderValue:
          salesData.length > 0 ? totalSales / salesData.length : 0,
      };
    })
  );

  return {
    totalUsers: users.length,
    activeUsers: userPerformance.filter((user) => user.totalSales > 0).length,
    topPerformers: userPerformance
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10),
    userPerformance,
  };
}

async function getFinancialSummary(
  session: string,
  dateFilter: any,
  workspace: string,
  userId: string,
  isAdmin: boolean
) {
  const salesData = await prisma.orderItem.findMany({
    where: {
      ...dateFilter,
      ...(session !== 'All'
        ? {
            consolidation: {
              session: session,
            },
          }
        : {
            consolidationId: {
              not: null,
            },
          }),
    },
    include: {
      consolidation: {
        include: {
          user: true,
        },
      },
    },
  });

  const totalRevenue = salesData.reduce(
    (sum, item) => sum + item.quantity * (item.price || 0),
    0
  );
  const totalItemsSold = salesData.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Calculate daily revenue
  const dailyRevenue = salesData.reduce((acc, item) => {
    const date = item.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += item.quantity * (item.price || 0);
    return acc;
  }, {} as any);

  // Calculate revenue by book
  const revenueByBook = salesData.reduce((acc, item) => {
    if (!acc[item.productName]) {
      acc[item.productName] = { revenue: 0, quantity: 0 };
    }
    acc[item.productName].revenue += item.quantity * (item.price || 0);
    acc[item.productName].quantity += item.quantity;
    return acc;
  }, {} as any);

  return {
    totalRevenue,
    totalItemsSold,
    averageOrderValue:
      salesData.length > 0 ? totalRevenue / salesData.length : 0,
    dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue,
    })),
    topSellingBooks: Object.entries(revenueByBook)
      .map(([book, data]: [string, any]) => ({
        book,
        revenue: data.revenue,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
  };
}

async function getSessionClosingData(
  session: string,
  workspace: string,
  userId: string,
  isAdmin: boolean
) {
  if (!isAdmin) {
    return { message: 'Access denied' };
  }

  const mainStoreSessions = await prisma.mainStoreSession.findMany({
    where: {
      session: session,
      isActive: false,
    },
    select: {
      id: true,
      name: true,
      session: true,
      closingStock: true,
      closedAt: true,
    },
  });

  const miniStoreSessions = await prisma.miniStoreSession.findMany({
    where: {
      session: session,
      isActive: false,
    },
    select: {
      id: true,
      session: true,
      closingStock: true,
      closedAt: true,
    },
  });

  const allSessions = [
    ...mainStoreSessions.map((s) => ({ ...s, type: 'main-store' })),
    ...miniStoreSessions.map((s) => ({
      ...s,
      type: 'mini-store',
      name: 'Mini Store',
    })),
  ];

  return {
    totalClosedSessions: allSessions.length,
    mainStoreSessions: mainStoreSessions.length,
    miniStoreSessions: miniStoreSessions.length,
    sessions: allSessions.map((session) => ({
      id: session.id,
      type: session.type,
      name: session.name || 'N/A',
      session: session.session,
      closedAt: session.closedAt,
      closingStock: session.closingStock,
    })),
  };
}
