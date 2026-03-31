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

      // Determine workspace
      let workspace = isAdmin ? 'admin' : 'unknown';
      let tableSaleSessionId: string | null = null;
      let preorderSessionId: string | null = null;
      let miniStoreSessionId: string | null = null;
      let mainStoreSessionId: string | null = null;

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
            miniStoreSession: true,
            mainStoreSession: true,
          },
        });

        workspace = mySession?.workspace || 'unknown';
        tableSaleSessionId = mySession?.tableSaleSessionId || null;
        preorderSessionId = mySession?.preorderSessionId || null;
        miniStoreSessionId = mySession?.miniStoreSessionId || null;
        mainStoreSessionId = mySession?.mainStoreSessionId || null;
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
          dashboardData = await getPreOrderDashboard(
            preorderSessionId,
            userId,
            currentSession
          );
          break;
        case 'mini-store':
          dashboardData = await getMiniStoreDashboard(
            miniStoreSessionId,
            currentSession
          );
          break;
        case 'preorder-ministore':
          dashboardData = await getMiniStoreDashboard(
            miniStoreSessionId,
            currentSession
          );
          break;
        case 'main-store':
          dashboardData = await getMainStoreDashboard(
            mainStoreSessionId,
            currentSession
          );
          break;
        case 'admin':
          dashboardData = await getAdminDashboard(currentSession);
          break;
        default:
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

async function getAdminDashboard(currentSession: string) {
  // Aggregate overall sales and inventory for current session
  // Get all table sale sessions for this session
  const tableSessions = await prisma.tableSaleSession.findMany({
    where: { session: currentSession },
    select: { id: true },
  });

  const tableSessionIds = tableSessions.map((s) => s.id);

  const bookSales = await prisma.bookSale.findMany({
    where: {
      sessionId: {
        in: tableSessionIds.length > 0 ? tableSessionIds : undefined,
      },
    },
    include: {
      items: {
        include: {
          book: true,
        },
      },
    },
  });

  const totalSalesRevenue = bookSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = bookSales.length;

  const perBook: Record<
    string,
    { title: string; quantity: number; revenue: number }
  > = {};

  let totalItemsSold = 0;

  bookSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const bookId = item.bookId;
      if (!bookId) return;
      const title = item.book.title;
      const qty = item.quantity;
      const rev = item.quantity * item.price;

      totalItemsSold += qty;

      if (!perBook[bookId]) {
        perBook[bookId] = { title, quantity: 0, revenue: 0 };
      }
      perBook[bookId].quantity += qty;
      perBook[bookId].revenue += rev;
    });
  });

  const topBooks = Object.values(perBook)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  // Pre-order revenue (all completed pre-orders)
  const preOrders = await prisma.preOrder.findMany({
    where: {
      orderStatus: 'COMPLETED',
    },
  });

  const totalPreorderRevenue = preOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  // Inventory overview
  const books = await prisma.book.findMany();
  const totalBooksInCatalog = books.length;
  const totalCurrentStock = books.reduce(
    (sum, book) => sum + (book.salesAvailable || 0),
    0
  );

  return {
    totalSalesRevenue,
    totalPreorderRevenue,
    totalRevenue: totalSalesRevenue + totalPreorderRevenue,
    totalTransactions,
    totalItemsSold,
    totalBooksInCatalog,
    totalCurrentStock,
    topBooks,
  };
}

async function getBookSalesDashboard(tableSaleSessionId: string | null) {
  if (!tableSaleSessionId) {
    return {
      totalSales: 0,
      totalItems: 0,
      uniqueBooks: 0,
      totalTransactions: 0,
      recentActivity: [],
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
    (sum, sale) =>
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const uniqueBooks = new Set(
    bookSales.flatMap((sale) => sale.items.map((item) => item.book.title))
  ).size;

  // Get recent sales (last 10)
  const recentSales = bookSales
    .slice(-10)
    .reverse()
    .map((sale) => ({
      id: sale.id,
      orderNumber: sale.orderNumber,
      slipNumber: sale.slipNumber,
      customerName: sale.fullName,
      items: sale.items.map((item) => ({
        title: item.book.title,
        quantity: item.quantity,
        price: item.price,
      })),
      total: sale.total,
      createdAt: sale.createdAt,
    }));

  return {
    totalSales,
    totalItems,
    uniqueBooks,
    totalTransactions: bookSales.length,
    recentActivity: recentSales,
  };
}

async function getTableManagerDashboard(tableSaleSessionId: string | null) {
  if (!tableSaleSessionId) {
    return {
      totalBooks: 0,
      totalStockValue: 0,
      totalSoldValue: 0,
      totalRemainingValue: 0,
      recentActivity: [],
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
      soldQuantities[bookTitle] =
        (soldQuantities[bookTitle] || 0) + item.quantity;
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

  // Get recent activity - books with sold and remaining quantities
  const recentActivity = stockList
    .map((stockItem: any) => {
      const stockTitle = (stockItem.title || '').trim().toLowerCase();
      const soldQuantity = soldQuantities[stockTitle] || 0;
      const totalStocksReceived = stockItem.total || stockItem.quantity || 0;
      const remainingStock = totalStocksReceived - soldQuantity;
      const unitPrice = stockItem.price || 0;

      return {
        bookId: stockItem.bookId || '',
        title: stockItem.title,
        totalReceived: totalStocksReceived,
        sold: soldQuantity,
        remaining: remainingStock,
        unitPrice,
        valueOfSold: soldQuantity * unitPrice,
        valueOfRemaining: remainingStock * unitPrice,
      };
    })
    .filter((item: any) => item.sold > 0) // Only show books that have been sold
    .sort((a: any, b: any) => b.sold - a.sold); // Sort by sold quantity descending

  return {
    totalBooks: stockList.length,
    totalStockValue,
    totalSoldValue,
    totalRemainingValue,
    recentActivity,
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
    (sum, cons) =>
      sum + cons.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const totalValue = consolidations.reduce(
    (sum, cons) =>
      sum +
      cons.items.reduce(
        (itemSum, item) => itemSum + item.quantity * (item.price || 0),
        0
      ),
    0
  );

  // Count collected vs pending
  const collectedOrders = consolidations.filter(
    (cons) => cons.order?.isCollected
  ).length;
  const pendingOrders = totalOrders - collectedOrders;

  // Get recent activity - last 10 consolidations
  const recentActivity = consolidations
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((cons) => ({
      id: cons.id,
      orderNumber: cons.order?.orderNumber || 'N/A',
      customerName: cons.order?.fullName || 'N/A',
      items: cons.items.map((item) => ({
        title: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      total: cons.items.reduce(
        (sum, item) => sum + item.quantity * (item.price || 0),
        0
      ),
      isCollected: cons.order?.isCollected || false,
      createdAt: cons.createdAt,
    }));

  return {
    totalOrders,
    totalItems,
    totalValue,
    collectedOrders,
    pendingOrders,
    recentActivity,
  };
}

async function getMiniStoreDashboard(
  miniStoreSessionId: string | null,
  currentSession: string
) {
  if (!miniStoreSessionId) {
    return {
      totalBooks: 0,
      totalStockValue: 0,
      totalDistributed: 0,
      totalRemaining: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      recentActivity: [],
    };
  }

  const miniStoreSession = await prisma.miniStoreSession.findFirst({
    where: {
      id: miniStoreSessionId,
    },
  });

  const stockList = (miniStoreSession?.data as any)?.list || [];

  // Calculate totals
  let totalStockValue = 0;
  let totalDistributed = 0;
  let totalRemaining = 0;

  stockList.forEach((stockItem: any) => {
    const total = stockItem.total || stockItem.quantity || 0;
    const available = stockItem.available || 0;
    const distributed = stockItem.distributed || 0;
    const unitPrice = stockItem.price || 0;

    totalStockValue += total * unitPrice;
    totalDistributed += distributed * unitPrice;
    totalRemaining += available * unitPrice;
  });

  // Get all requests for accurate counts
  const allRequests = await prisma.miniStoreRequest.findMany({
    where: {
      miniStoreSessionId: miniStoreSessionId,
    },
  });

  const pendingRequests = allRequests.filter(
    (req) => !req.wasApproved && !req.wasDenied
  ).length;
  const approvedRequests = allRequests.filter((req) => req.wasApproved).length;

  // Get recent activity - top distributed books
  const recentActivity = stockList
    .map((stockItem: any) => {
      const total = stockItem.total || stockItem.quantity || 0;
      const available = stockItem.available || 0;
      const distributed = stockItem.distributed || 0;
      const unitPrice = stockItem.price || 0;

      return {
        bookId: stockItem.bookId || '',
        title: stockItem.title,
        total,
        distributed,
        remaining: available,
        unitPrice,
        valueOfDistributed: distributed * unitPrice,
        valueOfRemaining: available * unitPrice,
      };
    })
    .filter((item: any) => item.distributed > 0)
    .sort((a: any, b: any) => b.distributed - a.distributed);

  return {
    totalBooks: stockList.length,
    totalStockValue,
    totalDistributed,
    totalRemaining,
    pendingRequests,
    approvedRequests,
    recentActivity,
  };
}

async function getMainStoreDashboard(
  mainStoreSessionId: string | null,
  currentSession: string
) {
  if (!mainStoreSessionId) {
    return {
      totalBooks: 0,
      totalStockValue: 0,
      totalDistributed: 0,
      totalRemaining: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      recentActivity: [],
    };
  }

  const mainStoreSession = await prisma.mainStoreSession.findFirst({
    where: {
      id: mainStoreSessionId,
    },
  });

  const stockList = (mainStoreSession?.data as any)?.list || [];

  // Calculate totals
  let totalStockValue = 0;
  let totalDistributed = 0;
  let totalRemaining = 0;

  stockList.forEach((stockItem: any) => {
    const total = stockItem.total || stockItem.quantity || 0;
    const available = stockItem.available || 0;
    const distributed = stockItem.distributed || 0;
    const unitPrice = stockItem.price || 0;

    totalStockValue += total * unitPrice;
    totalDistributed += distributed * unitPrice;
    totalRemaining += available * unitPrice;
  });

  // Get all requests for accurate counts
  const allRequests = await prisma.mainStoreRequest.findMany({
    where: {
      mainStoreSessionId: mainStoreSessionId,
    },
    include: {
      miniStoreSession: true,
    },
  });

  const pendingRequests = allRequests.filter(
    (req) => !req.wasApproved && !req.wasDenied
  ).length;
  const approvedRequests = allRequests.filter((req) => req.wasApproved).length;

  // Get recent activity - top distributed books
  const recentActivity = stockList
    .map((stockItem: any) => {
      const total = stockItem.total || stockItem.quantity || 0;
      const available = stockItem.available || 0;
      const distributed = stockItem.distributed || 0;
      const unitPrice = stockItem.price || 0;

      return {
        bookId: stockItem.bookId || '',
        title: stockItem.title,
        total,
        distributed,
        remaining: available,
        unitPrice,
        valueOfDistributed: distributed * unitPrice,
        valueOfRemaining: available * unitPrice,
      };
    })
    .filter((item: any) => item.distributed > 0)
    .sort((a: any, b: any) => b.distributed - a.distributed);

  return {
    totalBooks: stockList.length,
    totalStockValue,
    totalDistributed,
    totalRemaining,
    pendingRequests,
    approvedRequests,
    recentActivity,
  };
}
