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

      // Get user's mySession to find their tableSaleSessionId for table-manager, book-sales, and pre-order
      let tableSaleSessionId: string | null = null;
      if (workspace === 'table-manager' || workspace === 'book-sales') {
        const mySession = await prisma.mySession.findFirst({
          where: {
            userId: userId,
            session: currentSession,
            workspace: workspace,
            isActive: true,
          },
          include: {
            tableSaleSession: true,
          },
        });
        tableSaleSessionId = mySession?.tableSaleSessionId || null;
      } else if (workspace === 'pre-order') {
        // For pre-order, get table session from preorderSession
        const mySession = await prisma.mySession.findFirst({
          where: {
            userId: userId,
            session: currentSession,
            workspace: workspace,
            isActive: true,
          },
          include: {
            preorderSession: {
              include: {
                tableSaleSession: true,
              },
            },
          },
        });
        tableSaleSessionId = mySession?.preorderSession?.tableSaleSessionId || null;
      }

      // Base date filter - don't use for book-sales workspace
      const dateFilter =
        workspace === 'book-sales'
          ? {}
          : dateFrom && dateTo
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
            isAdmin,
            tableSaleSessionId
          );
          break;
        case 'books-sold':
          reportData = await getBooksSold(
            currentSession,
            workspace,
            userId,
            isAdmin,
            tableSaleSessionId
          );
          break;
        case 'stock-movement':
          reportData = await getStockMovement(
            currentSession,
            dateFilter,
            workspace,
            userId,
            isAdmin,
            tableSaleSessionId
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
  isAdmin: boolean,
  tableSaleSessionId: string | null = null
) {
  // For book-sales role, use BookSale model instead of OrderItem
  // Don't use date filter for book-sales - always use current session
  if (workspace === 'book-sales') {
    if (!tableSaleSessionId) {
      return {
        totalSales: 0,
        totalItems: 0,
        uniqueBooks: 0,
        totalTransactions: 0,
        salesByUser: null,
        recentSales: [],
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
      orderBy: {
        createdAt: 'desc',
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

    return {
      totalSales,
      totalItems,
      uniqueBooks,
      totalTransactions: bookSales.length,
      salesByUser: null,
      recentSales: bookSales.slice(0, 10).map((sale) => ({
        id: sale.id,
        orderNumber: sale.orderNumber,
        slipNumber: sale.slipNumber,
        productName: sale.items.map((item) => item.book.title).join(', '),
        quantity: sale.items.reduce((sum, item) => sum + item.quantity, 0),
        price:
          sale.total / sale.items.reduce((sum, item) => sum + item.quantity, 0),
        total: sale.total,
        soldBy: sale.fullName,
        soldAt: sale.createdAt,
        items: sale.items.map((item) => ({
          title: item.book.title,
          quantity: item.quantity,
          price: item.price,
        })),
      })),
    };
  }

  // For other roles, use OrderItem (pre-order consolidations)
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

async function getBooksSold(
  session: string,
  workspace: string,
  userId: string,
  isAdmin: boolean,
  tableSaleSessionId: string | null = null
) {
  // Only for book-sales workspace
  if (workspace !== 'book-sales') {
    return {
      booksSold: [],
      totalBooks: 0,
      totalQuantity: 0,
      totalValue: 0,
    };
  }

  if (!tableSaleSessionId) {
    return {
      booksSold: [],
      totalBooks: 0,
      totalQuantity: 0,
      totalValue: 0,
    };
  }

  // Get all book sales for the current session
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

  // Aggregate books sold by book title
  const booksSoldMap: Record<
    string,
    {
      bookId: string;
      title: string;
      quantity: number;
      price: number;
      value: number;
    }
  > = {};

  bookSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const bookTitle = item.book.title;
      const bookId = item.book.id;
      const price = item.price;
      const quantity = item.quantity;
      const value = price * quantity;

      if (booksSoldMap[bookTitle]) {
        booksSoldMap[bookTitle].quantity += quantity;
        booksSoldMap[bookTitle].value += value;
        // Calculate average price
        booksSoldMap[bookTitle].price =
          booksSoldMap[bookTitle].value / booksSoldMap[bookTitle].quantity;
      } else {
        booksSoldMap[bookTitle] = {
          bookId,
          title: bookTitle,
          quantity,
          price,
          value,
        };
      }
    });
  });

  // Convert to array and sort by value descending
  const booksSold = Object.values(booksSoldMap).sort(
    (a, b) => b.value - a.value
  );

  const totalBooks = booksSold.length;
  const totalQuantity = booksSold.reduce((sum, book) => sum + book.quantity, 0);
  const totalValue = booksSold.reduce((sum, book) => sum + book.value, 0);

  return {
    booksSold,
    totalBooks,
    totalQuantity,
    totalValue,
  };
}

async function getStockMovement(
  session: string,
  dateFilter: any,
  workspace: string,
  userId: string,
  isAdmin: boolean,
  tableSaleSessionId: string | null = null
) {
  // For table-manager and pre-order roles, get stock from their TableSaleSession
  if (workspace === 'table-manager' || workspace === 'pre-order') {
    if (!tableSaleSessionId) {
      return {
        totalBooks: 0,
        totalStockValue: 0,
        totalSoldValue: 0,
        totalRemainingValue: 0,
        lowStockBooks: [],
        stockMovement: [],
      };
    }
    const tableSaleSession = await prisma.tableSaleSession.findFirst({
      where: {
        id: tableSaleSessionId,
      },
    });

    const stockList = (tableSaleSession?.data as any)?.list || [];

    // Calculate sold quantities per book
    // Use normalized title (trimmed, lowercase) for matching to handle any inconsistencies
    const soldQuantities: Record<string, number> = {};
    const titleMap: Record<string, string> = {}; // Map normalized title to original title

    if (workspace === 'table-manager') {
      // For table-manager, get book sales for this session
      // Don't use date filter - get all sales for the current session
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

      bookSales.forEach((sale) => {
        sale.items.forEach((item) => {
          const bookTitle = item.book.title.trim();
          const normalizedTitle = bookTitle.toLowerCase();
          titleMap[normalizedTitle] = bookTitle;
          soldQuantities[normalizedTitle] =
            (soldQuantities[normalizedTitle] || 0) + item.quantity;
        });
      });
    } else if (workspace === 'pre-order') {
      // For pre-order, get collected order items from consolidations
      // Get all collected items for the current session from this table
      const collectedItems = await prisma.orderItem.findMany({
        where: {
          isCollected: true,
          consolidation: {
            session: session,
            userId: userId,
          },
        },
        include: {
          book: true,
          consolidation: true,
        },
      });

      // Map product names to book titles and calculate sold quantities
      for (const item of collectedItems) {
        let bookTitle = item.productName;
        
        // Try to get the actual book title from bookId or mapping
        if (item.bookId) {
          const book = await prisma.book.findUnique({
            where: { id: item.bookId },
            select: { title: true },
          });
          if (book) {
            bookTitle = book.title;
          }
        } else {
          // Try to get from mapping
          const mapping = await prisma.bookMapping.findUnique({
            where: { productName: item.productName },
            include: { book: true },
          });
          if (mapping?.book) {
            bookTitle = mapping.book.title;
          }
        }

        const normalizedTitle = bookTitle.trim().toLowerCase();
        titleMap[normalizedTitle] = bookTitle;
        soldQuantities[normalizedTitle] =
          (soldQuantities[normalizedTitle] || 0) + item.quantity;
      }
    }

    // Build stock movement from the table's stock list
    const stockMovement = stockList.map((stockItem: any) => {
      const stockTitle = (stockItem.title || '').trim();
      const normalizedStockTitle = stockTitle.toLowerCase();
      const soldQuantity = soldQuantities[normalizedStockTitle] || 0;
      const totalStocksReceived = stockItem.total || 0;
      const remainingStock = totalStocksReceived - soldQuantity;
      const unitPrice = stockItem.price || 0;
      const valueOfSold = soldQuantity * unitPrice;
      const valueOfRemaining = remainingStock * unitPrice;

      // Determine status based on remaining stock
      let status = 'Good Stock';
      if (remainingStock < 10) {
        status = 'Low Stock';
      } else if (remainingStock < 50) {
        status = 'Medium Stock';
      }

      return {
        bookId: stockItem.bookId || '',
        title: stockItem.title,
        totalStocksReceived,
        totalSold: soldQuantity,
        totalRemaining: remainingStock,
        valueOfSold,
        valueOfRemaining,
        unitPrice,
        status,
        // Keep old fields for backward compatibility
        initialStock: totalStocksReceived,
        currentStock: remainingStock,
        soldQuantity,
        remainingStock,
        price: unitPrice,
        totalValue: valueOfRemaining,
      };
    });

    // Calculate totals
    const totalSoldValue = stockMovement.reduce(
      (sum: number, item: any) => sum + item.valueOfSold,
      0
    );
    const totalRemainingValue = stockMovement.reduce(
      (sum: number, item: any) => sum + item.valueOfRemaining,
      0
    );

    return {
      totalBooks: stockMovement.length,
      totalStockValue: totalRemainingValue, // Keep for backward compatibility
      totalSoldValue,
      totalRemainingValue,
      lowStockBooks: stockMovement.filter(
        (item: any) => item.totalRemaining < 10
      ),
      stockMovement,
    };
  }

  // For other roles, use global book stock
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

    const totalStocksReceived = book.total;
    const totalRemaining = book.available;
    const unitPrice = book.price;
    const valueOfSold = soldQuantity * unitPrice;
    const valueOfRemaining = totalRemaining * unitPrice;

    // Determine status based on remaining stock
    let status = 'Good Stock';
    if (totalRemaining < 10) {
      status = 'Low Stock';
    } else if (totalRemaining < 50) {
      status = 'Medium Stock';
    }

    return {
      bookId: book.id,
      title: book.title,
      totalStocksReceived,
      totalSold: soldQuantity,
      totalRemaining,
      valueOfSold,
      valueOfRemaining,
      unitPrice,
      status,
      // Keep old fields for backward compatibility
      initialStock: totalStocksReceived,
      currentStock: totalRemaining,
      soldQuantity,
      remainingStock: totalRemaining,
      price: unitPrice,
      totalValue: valueOfRemaining,
    };
  });

  // Calculate totals
  const totalSoldValue = stockMovement.reduce(
    (sum: number, item: any) => sum + item.valueOfSold,
    0
  );
  const totalRemainingValue = stockMovement.reduce(
    (sum: number, item: any) => sum + item.valueOfRemaining,
    0
  );

  return {
    totalBooks: currentStock.length,
    totalStockValue: totalRemainingValue, // Keep for backward compatibility
    totalSoldValue,
    totalRemainingValue,
    lowStockBooks: stockMovement.filter(
      (item: any) => item.totalRemaining < 10
    ),
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
