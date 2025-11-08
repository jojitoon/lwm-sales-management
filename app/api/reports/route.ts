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
      // Also get miniStoreSessionId for mini-store and mainStoreSessionId for main-store
      let tableSaleSessionId: string | null = null;
      let miniStoreSessionId: string | null = null;
      let mainStoreSessionId: string | null = null;
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
        tableSaleSessionId =
          mySession?.preorderSession?.tableSaleSessionId || null;
      } else if (workspace === 'mini-store' || workspace === 'preorder-ministore') {
        const mySession = await prisma.mySession.findFirst({
          where: {
            userId: userId,
            session: currentSession,
            workspace: workspace,
            isActive: true,
          },
          include: {
            miniStoreSession: true,
          },
        });
        miniStoreSessionId = mySession?.miniStoreSessionId || null;
      } else if (workspace === 'main-store') {
        const mySession = await prisma.mySession.findFirst({
          where: {
            userId: userId,
            session: currentSession,
            workspace: workspace,
            isActive: true,
          },
          include: {
            mainStoreSession: true,
          },
        });
        mainStoreSessionId = mySession?.mainStoreSessionId || null;
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
            tableSaleSessionId,
            miniStoreSessionId
          );
          break;
        case 'stock-summary':
          reportData = await getStockSummary(
            currentSession,
            workspace,
            userId,
            isAdmin,
            miniStoreSessionId,
            mainStoreSessionId
          );
          break;
        case 'request-status':
          reportData = await getRequestStatus(
            currentSession,
            dateFilter,
            workspace,
            userId,
            isAdmin,
            miniStoreSessionId
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
        case 'closing-stock':
          reportData = await getClosingStockReport(
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
          book: {
            include: {
              comboItems: {
                include: {
                  componentBook: true,
                },
              },
            },
          },
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
      isCombo: boolean;
    }
  > = {};

  // Track component book quantities sold as part of combos
  const componentBookDeductions: Record<string, number> = {};

  bookSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const book = item.book;
      const bookTitle = book.title;
      const bookId = book.id;
      const price = item.price;
      const quantity = item.quantity;
      const value = price * quantity;
      const isCombo = book.isCombo || false;

      // If it's a combo book, track component book deductions
      if (isCombo && book.comboItems) {
        book.comboItems.forEach((comboItem) => {
          const componentTitle = comboItem.componentBook.title;
          const componentQuantity = quantity * comboItem.quantity;
          
          if (!componentBookDeductions[componentTitle]) {
            componentBookDeductions[componentTitle] = 0;
          }
          componentBookDeductions[componentTitle] += componentQuantity;
        });
      }

      // Add to books sold map (combo books are included)
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
          isCombo,
        };
      }
    });
  });

  // Deduct component book quantities that were sold as part of combos
  Object.keys(componentBookDeductions).forEach((componentTitle) => {
    if (booksSoldMap[componentTitle]) {
      booksSoldMap[componentTitle].quantity -= componentBookDeductions[componentTitle];
      // Recalculate value after deduction
      booksSoldMap[componentTitle].value =
        booksSoldMap[componentTitle].quantity * booksSoldMap[componentTitle].price;
      
      // Remove if quantity becomes 0 or negative
      if (booksSoldMap[componentTitle].quantity <= 0) {
        delete booksSoldMap[componentTitle];
      }
    }
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
  tableSaleSessionId: string | null = null,
  miniStoreSessionId: string | null = null
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

    // Get all combo books to filter them out from inventory
    const comboBooks = await prisma.book.findMany({
      where: { isCombo: true },
      select: { title: true },
    });
    const comboBookTitles = new Set(comboBooks.map((b) => b.title));

    // Filter out combo books from stock list (combo books should not be in inventory)
    const filteredStockList = stockList.filter(
      (item: any) => !comboBookTitles.has(item.title)
    );

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

    // Build stock movement from the table's stock list (excluding combo books)
    const stockMovement = filteredStockList.map((stockItem: any) => {
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

  // For mini-store, get stock from mini store session
  if (workspace === 'mini-store' || workspace === 'preorder-ministore') {
    if (!miniStoreSessionId) {
      return {
        totalBooks: 0,
        totalStockValue: 0,
        totalSoldValue: 0,
        totalRemainingValue: 0,
        lowStockBooks: [],
        stockMovement: [],
      };
    }

    const miniStoreSession = await prisma.miniStoreSession.findFirst({
      where: {
        id: miniStoreSessionId,
      },
    });

    const stockList = (miniStoreSession?.data as any)?.list || [];

    // Get all combo books to filter them out from inventory
    const comboBooks = await prisma.book.findMany({
      where: { isCombo: true },
      select: { title: true },
    });
    const comboBookTitles = new Set(comboBooks.map((b) => b.title));

    // Filter out combo books from stock list (combo books should not be in inventory)
    const filteredStockList = stockList.filter(
      (item: any) => !comboBookTitles.has(item.title)
    );

    // Calculate distributed quantities per book from approved requests
    const distributedQuantities: Record<string, number> = {};
    const titleMap: Record<string, string> = {};

    // Get all approved requests from this mini store
    const approvedRequests = await prisma.miniStoreRequest.findMany({
      where: {
        miniStoreSessionId: miniStoreSessionId,
        wasApproved: true,
      },
    });

    approvedRequests.forEach((request) => {
      const requestData = request.request as any;
      const items = requestData.items || [];
      items.forEach((item: any) => {
        const bookTitle = (item.bookTitle || '').trim();
        const normalizedTitle = bookTitle.toLowerCase();
        titleMap[normalizedTitle] = bookTitle;
        distributedQuantities[normalizedTitle] =
          (distributedQuantities[normalizedTitle] || 0) + (item.quantity || 0);
      });
    });

    // Build stock movement from the mini store's stock list (excluding combo books)
    const stockMovement = filteredStockList.map((stockItem: any) => {
      const stockTitle = (stockItem.title || '').trim();
      const normalizedStockTitle = stockTitle.toLowerCase();
      const distributedQuantity =
        distributedQuantities[normalizedStockTitle] || 0;
      const totalStocksReceived = stockItem.total || 0;
      const remainingStock = stockItem.available || 0;
      const unitPrice = stockItem.price || 0;
      const valueOfDistributed = distributedQuantity * unitPrice;
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
        totalSold: distributedQuantity, // For mini-store, "sold" means distributed
        totalRemaining: remainingStock,
        valueOfSold: valueOfDistributed,
        valueOfRemaining,
        unitPrice,
        status,
        // Keep old fields for backward compatibility
        initialStock: totalStocksReceived,
        currentStock: remainingStock,
        soldQuantity: distributedQuantity,
        remainingStock,
        price: unitPrice,
        totalValue: valueOfRemaining,
      };
    });

    // Calculate totals
    const totalDistributedValue = stockMovement.reduce(
      (sum: number, item: any) => sum + item.valueOfSold,
      0
    );
    const totalRemainingValue = stockMovement.reduce(
      (sum: number, item: any) => sum + item.valueOfRemaining,
      0
    );

    return {
      totalBooks: stockMovement.length,
      totalStockValue: totalRemainingValue,
      totalSoldValue: totalDistributedValue,
      totalRemainingValue,
      lowStockBooks: stockMovement.filter(
        (item: any) => item.totalRemaining < 10
      ),
      stockMovement,
    };
  }

  // For other roles, use global book stock (exclude combo books from inventory)
  const currentStock = await prisma.book.findMany({
    where: { 
      isActive: true,
      isCombo: false, // Combo books should not be in inventory
    },
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
  isAdmin: boolean,
  miniStoreSessionId: string | null = null
) {
  let allRequests: any[] = [];

  // For mini-store workspace: show only requests made TO the mini store
  // (requests from table managers/preorders to the mini store)
  if (workspace === 'mini-store' || workspace === 'preorder-ministore') {
    const whereClause: any = {
      ...dateFilter,
      miniStoreSession: {
        session: session,
      },
    };

    // If we have a specific miniStoreSessionId, filter by it
    if (miniStoreSessionId) {
      whereClause.miniStoreSessionId = miniStoreSessionId;
    }

    const miniStoreRequests = await prisma.miniStoreRequest.findMany({
      where: whereClause,
      include: {
        miniStoreSession: true,
        tableSaleSession: true,
        preorderSession: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    allRequests = miniStoreRequests.map((req) => ({
      ...req,
      type: 'mini-store',
    }));
  }
  // For main-store workspace: show only requests made BY mini store TO main store
  else if (workspace === 'main-store') {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    allRequests = mainStoreRequests.map((req) => ({
      ...req,
      type: 'main-store',
    }));
  }
  // For admin or other workspaces: show all requests
  else {
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

    allRequests = [
      ...mainStoreRequests.map((req) => ({ ...req, type: 'main-store' })),
      ...miniStoreRequests.map((req) => ({ ...req, type: 'mini-store' })),
    ];
  }

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
      // Include additional context based on request type
      ...(req.type === 'mini-store' && {
        tableSaleSession: req.tableSaleSession
          ? {
              id: req.tableSaleSession.id,
              tableId: req.tableSaleSession.tableId,
              name: req.tableSaleSession.name,
            }
          : null,
        preorderSession: req.preorderSession
          ? {
              id: req.preorderSession.id,
            }
          : null,
      }),
      ...(req.type === 'main-store' && {
        miniStoreSession: req.miniStoreSession
          ? {
              id: req.miniStoreSession.id,
            }
          : null,
      }),
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
      type: true,
      closingStock: true,
      closedAt: true,
    },
  });

  const allSessions = [
    ...mainStoreSessions.map((s) => ({ ...s, type: 'main-store' })),
    ...miniStoreSessions.map((s) => ({
      ...s,
      type: s.type === 'preorder' ? 'preorder-ministore' : 'mini-store',
      name: s.type === 'preorder' ? 'Preorder Mini Store' : 'Mini Store',
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

async function getClosingStockReport(
  session: string,
  workspace: string,
  userId: string,
  isAdmin: boolean
) {
  // Get all closing stock data from table sessions, mini stores, and main stores
  const tableSessions = await prisma.tableSaleSession.findMany({
    where: {
      session: session,
    },
    include: {
      miniStoreRequests: {
        where: {
          wasApproved: true,
        },
        include: {
          miniStoreSession: {
            select: {
              id: true,
              type: true,
            },
          },
        },
      },
    },
  });

  const miniStoreSessions = await prisma.miniStoreSession.findMany({
    where: {
      session: session,
    },
    include: {
      mainStoreRequests: {
        where: {
          wasApproved: true,
        },
        include: {
          mainStoreSession: true,
        },
      },
    },
  });

  const mainStoreSessions = await prisma.mainStoreSession.findMany({
    where: {
      session: session,
    },
  });

  // Get all combo books to filter them out from inventory
  const comboBooks = await prisma.book.findMany({
    where: { isCombo: true },
    select: { title: true },
  });
  const comboBookTitles = new Set(comboBooks.map((b) => b.title));

  // Build closing stock flow data
  const closingStockFlow: any[] = [];

  // Process table manager closings
  for (const tableSession of tableSessions) {
    const closingStock = (tableSession.data as any)?.closingStock;
    if (closingStock) {
      const miniStoreRequest = tableSession.miniStoreRequests[0];
      // Filter out combo books from closing stock items
      const filteredItems = (closingStock.remainingStock || []).filter(
        (item: any) => !comboBookTitles.has(item.title)
      );
      const filteredTotalQuantity = filteredItems.reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      );
      
      // Determine mini store type from the request
      let storeType = 'mini-store';
      let storeName = 'Mini Store';
      if (miniStoreRequest?.miniStoreSession) {
        const miniStoreType = (miniStoreRequest.miniStoreSession as any).type;
        if (miniStoreType === 'preorder') {
          storeType = 'preorder-ministore';
          storeName = 'Preorder Mini Store';
        }
      }
      
      closingStockFlow.push({
        from: {
          type: 'table-manager',
          name: tableSession.name || tableSession.tableId,
          id: tableSession.id,
        },
        to: {
          type: storeType,
          name: storeName,
          id: miniStoreRequest?.miniStoreSessionId || null,
        },
        closedAt: closingStock.closedAt,
        closedBy: closingStock.closedBy,
        items: filteredItems,
        totalItems: filteredItems.length,
        totalQuantity: filteredTotalQuantity,
      });
    }
  }

  // Process mini store closings
  for (const miniStoreSession of miniStoreSessions) {
    if (miniStoreSession.closingStock) {
      const mainStoreRequest = miniStoreSession.mainStoreRequests[0];
      const closingStock = miniStoreSession.closingStock as any;
      // Filter out combo books from closing stock items
      const filteredItems = (closingStock.remainingStock || []).filter(
        (item: any) => !comboBookTitles.has(item.title)
      );
      const filteredTotalQuantity = filteredItems.reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      );
      
      const storeType = miniStoreSession.type === 'preorder' ? 'preorder-ministore' : 'mini-store';
      const storeName = miniStoreSession.type === 'preorder' ? 'Preorder Mini Store' : 'Mini Store';
      
      closingStockFlow.push({
        from: {
          type: storeType,
          name: storeName,
          id: miniStoreSession.id,
        },
        to: {
          type: 'main-store',
          name: mainStoreRequest?.mainStoreSession?.name || 'Main Store',
          id: mainStoreRequest?.mainStoreSessionId || null,
        },
        closedAt: miniStoreSession.closedAt?.toISOString(),
        closedBy: closingStock.closedBy,
        items: filteredItems,
        totalItems: filteredItems.length,
        totalQuantity: filteredTotalQuantity,
      });
    }
  }

  // Calculate summary statistics
  const totalClosings = closingStockFlow.length;
  const totalItemsReturned = closingStockFlow.reduce(
    (sum, flow) => sum + (flow.totalQuantity || 0),
    0
  );

  // Group by book title to see total returns
  const bookReturns: Record<string, { quantity: number; flows: number }> = {};
  for (const flow of closingStockFlow) {
    for (const item of flow.items || []) {
      if (!bookReturns[item.title]) {
        bookReturns[item.title] = { quantity: 0, flows: 0 };
      }
      bookReturns[item.title].quantity += item.quantity || 0;
      bookReturns[item.title].flows += 1;
    }
  }

  return {
    totalClosings,
    totalItemsReturned,
    closingStockFlow: closingStockFlow.sort(
      (a, b) =>
        new Date(b.closedAt || 0).getTime() -
        new Date(a.closedAt || 0).getTime()
    ),
    bookReturns: Object.entries(bookReturns)
      .map(([title, data]) => ({
        title,
        totalQuantity: data.quantity,
        numberOfReturns: data.flows,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity),
  };
}

async function getStockSummary(
  session: string,
  workspace: string,
  userId: string,
  isAdmin: boolean,
  miniStoreSessionId: string | null = null,
  mainStoreSessionId: string | null = null
) {
  // Get all combo books to filter them out from inventory
  const comboBooks = await prisma.book.findMany({
    where: { isCombo: true },
    select: { title: true },
  });
  const comboBookTitles = new Set(comboBooks.map((b) => b.title));
  
  // For main-store workspace: show books given to mini stores and returned
  if (workspace === 'main-store') {
    // Get main store session
    let mainStoreSession = null;
    if (mainStoreSessionId) {
      mainStoreSession = await prisma.mainStoreSession.findFirst({
        where: { id: mainStoreSessionId },
      });
    } else if (isAdmin) {
      // For admin, get the first active main store session for the session
      mainStoreSession = await prisma.mainStoreSession.findFirst({
        where: {
          session: session,
          isActive: true,
        },
      });
    }

    if (!mainStoreSession) {
      return {
        miniStores: [],
        totalMiniStores: 0,
        totalBooksDistributed: 0,
        totalBooksReturned: 0,
        isMainStore: true,
      };
    }

    // Get all approved requests from this main store to mini stores
    const approvedRequests = await prisma.mainStoreRequest.findMany({
      where: {
        mainStoreSessionId: mainStoreSession.id,
        wasApproved: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out requests without miniStoreSessionId in JavaScript
    const validRequests = approvedRequests.filter(
      (req) => req.miniStoreSessionId !== null
    );

    // Get all mini store sessions that received stock
    const miniStoreSessionIds = validRequests
      .map((req) => req.miniStoreSessionId)
      .filter((id): id is string => id !== null);

    const miniStoreSessions = await prisma.miniStoreSession.findMany({
      where: {
        id: { in: miniStoreSessionIds },
      },
      select: {
        id: true,
        closingStock: true,
      },
    });

    const miniStoreSessionsMap = new Map(
      miniStoreSessions.map((ms) => [ms.id, ms])
    );

    // Group by mini store session
    const miniStoreDataMap: Record<
      string,
      {
        miniStoreId: string;
        miniStoreName: string;
        booksGiven: Array<{ title: string; quantity: number; price: number }>;
        booksReturned: Array<{
          title: string;
          quantity: number;
          price: number;
        }>;
      }
    > = {};

    for (const request of validRequests) {
      if (!request.miniStoreSessionId) continue;

      const miniStoreId = request.miniStoreSessionId;
      const miniStoreName = 'Mini Store'; // You can add a name field if needed

      if (!miniStoreDataMap[miniStoreId]) {
        miniStoreDataMap[miniStoreId] = {
          miniStoreId,
          miniStoreName,
          booksGiven: [],
          booksReturned: [],
        };
      }

      // Get books given from the request (filter out combo books)
      const requestData = request.request as any;
      const items = requestData.items || [];
      items.forEach((item: any) => {
        // Skip combo books - they should not be in inventory
        if (comboBookTitles.has(item.bookTitle)) return;
        
        const existing = miniStoreDataMap[miniStoreId].booksGiven.find(
          (b) => b.title === item.bookTitle
        );
        if (existing) {
          existing.quantity += item.quantity || 0;
        } else {
          miniStoreDataMap[miniStoreId].booksGiven.push({
            title: item.bookTitle,
            quantity: item.quantity || 0,
            price: item.price || 0,
          });
        }
      });

      // Get books returned (from mini store closing stock) - filter out combo books
      const miniStoreSession = miniStoreSessionsMap.get(miniStoreId);
      if (miniStoreSession?.closingStock) {
        const closingStock = miniStoreSession.closingStock as any;
        if (closingStock.remainingStock) {
          closingStock.remainingStock.forEach((item: any) => {
            // Skip combo books - they should not be in inventory
            if (comboBookTitles.has(item.title)) return;
            
            miniStoreDataMap[miniStoreId].booksReturned.push({
              title: item.title,
              quantity: item.quantity || 0,
              price: item.price || 0,
            });
          });
        }
      }
    }

    // Convert to array and calculate totals
    const miniStores = Object.values(miniStoreDataMap).map((miniStore) => {
      // Merge all books for this mini store
      const allBooks = new Set<string>();
      miniStore.booksGiven.forEach((b) => allBooks.add(b.title));
      miniStore.booksReturned.forEach((b) => allBooks.add(b.title));

      const bookDetails = Array.from(allBooks).map((bookTitle) => {
        const given = miniStore.booksGiven.find((b) => b.title === bookTitle);
        const returned = miniStore.booksReturned.find(
          (b) => b.title === bookTitle
        );

        return {
          title: bookTitle,
          given: given?.quantity || 0,
          returned: returned?.quantity || 0,
          remaining: (given?.quantity || 0) - (returned?.quantity || 0),
          unitPrice: given?.price || returned?.price || 0,
        };
      });

      return {
        ...miniStore,
        bookDetails,
        totalBooksGiven: miniStore.booksGiven.reduce(
          (sum, b) => sum + b.quantity,
          0
        ),
        totalBooksReturned: miniStore.booksReturned.reduce(
          (sum, b) => sum + b.quantity,
          0
        ),
      };
    });

    const totalBooksDistributed = miniStores.reduce(
      (sum, ms) => sum + ms.totalBooksGiven,
      0
    );
    const totalBooksReturned = miniStores.reduce(
      (sum, ms) => sum + ms.totalBooksReturned,
      0
    );

    return {
      miniStores: miniStores.sort((a, b) =>
        a.miniStoreId.localeCompare(b.miniStoreId)
      ),
      totalMiniStores: miniStores.length,
      totalBooksDistributed,
      totalBooksReturned,
      isMainStore: true,
    };
  }

  // For mini-store or preorder-ministore workspace: show books given to tables and returned
  // Get mini store session
  let miniStoreSession = null;
  if (miniStoreSessionId) {
    miniStoreSession = await prisma.miniStoreSession.findFirst({
      where: { id: miniStoreSessionId },
    });
  } else if (isAdmin) {
    // For admin, get the first active mini store session for the session
    // If workspace is preorder-ministore, filter by type
    const whereClause: any = {
      session: session,
      isActive: true,
    };
    if (workspace === 'preorder-ministore') {
      whereClause.type = 'preorder';
    } else if (workspace === 'mini-store') {
      whereClause.type = 'regular';
    }
    miniStoreSession = await prisma.miniStoreSession.findFirst({
      where: whereClause,
    });
  }

  if (!miniStoreSession) {
    return {
      tables: [],
      totalTables: 0,
      totalBooksDistributed: 0,
      totalBooksReturned: 0,
      isMainStore: false,
    };
  }

  // Get all approved requests from this mini store to table sessions
  const approvedRequests = await prisma.miniStoreRequest.findMany({
    where: {
      miniStoreSessionId: miniStoreSession.id,
      wasApproved: true,
      tableSaleSessionId: { not: null },
    },
    include: {
      tableSaleSession: {
        include: {
          bookSales: {
            include: {
              items: {
                include: {
                  book: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Group by table session
  const tableDataMap: Record<
    string,
    {
      tableId: string;
      tableName: string;
      booksGiven: Array<{ title: string; quantity: number; price: number }>;
      booksCollected: Array<{ title: string; quantity: number; price: number }>;
      closingStock: Array<{ title: string; quantity: number; price: number }>;
    }
  > = {};

  for (const request of approvedRequests) {
    if (!request.tableSaleSession) continue;

    const tableId = request.tableSaleSession.tableId;
    const tableName = request.tableSaleSession.name || tableId;

    if (!tableDataMap[tableId]) {
      tableDataMap[tableId] = {
        tableId,
        tableName,
        booksGiven: [],
        booksCollected: [],
        closingStock: [],
      };
    }

      // Get books given from the request (filter out combo books)
      const requestData = request.request as any;
      const items = requestData.items || [];
      items.forEach((item: any) => {
        // Skip combo books - they should not be in inventory
        if (comboBookTitles.has(item.bookTitle)) return;
        
        const existing = tableDataMap[tableId].booksGiven.find(
          (b) => b.title === item.bookTitle
        );
        if (existing) {
          existing.quantity += item.quantity || 0;
        } else {
          tableDataMap[tableId].booksGiven.push({
            title: item.bookTitle,
            quantity: item.quantity || 0,
            price: item.price || 0,
          });
        }
      });

    // Get books collected (sold) from book sales (filter out combo books from inventory)
    request.tableSaleSession.bookSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const bookTitle = item.book.title;
        // Skip combo books - they should not be in inventory
        if (comboBookTitles.has(bookTitle)) return;
        const existing = tableDataMap[tableId].booksCollected.find(
          (b) => b.title === bookTitle
        );
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          tableDataMap[tableId].booksCollected.push({
            title: bookTitle,
            quantity: item.quantity,
            price: item.price,
          });
        }
      });
    });

    // Get closing stock (returned)
    const closingStock = (request.tableSaleSession.data as any)?.closingStock;
    if (closingStock && closingStock.remainingStock) {
      closingStock.remainingStock.forEach((item: any) => {
        // Skip combo books - they should not be in inventory
        if (comboBookTitles.has(item.title)) return;
        
        tableDataMap[tableId].closingStock.push({
          title: item.title,
          quantity: item.quantity || 0,
          price: item.price || 0,
        });
      });
    }
  }

  // Convert to array and calculate totals
  const tables = Object.values(tableDataMap).map((table) => {
    // Merge all books for this table
    const allBooks = new Set<string>();
    table.booksGiven.forEach((b) => allBooks.add(b.title));
    table.booksCollected.forEach((b) => allBooks.add(b.title));
    table.closingStock.forEach((b) => allBooks.add(b.title));

    const bookDetails = Array.from(allBooks).map((bookTitle) => {
      const given = table.booksGiven.find((b) => b.title === bookTitle);
      const collected = table.booksCollected.find((b) => b.title === bookTitle);
      const returned = table.closingStock.find((b) => b.title === bookTitle);

      return {
        title: bookTitle,
        given: given?.quantity || 0,
        collected: collected?.quantity || 0,
        returned: returned?.quantity || 0,
        remaining: (given?.quantity || 0) - (collected?.quantity || 0),
        unitPrice: given?.price || collected?.price || returned?.price || 0,
      };
    });

    return {
      ...table,
      bookDetails,
      totalBooksGiven: table.booksGiven.reduce((sum, b) => sum + b.quantity, 0),
      totalBooksCollected: table.booksCollected.reduce(
        (sum, b) => sum + b.quantity,
        0
      ),
      totalBooksReturned: table.closingStock.reduce(
        (sum, b) => sum + b.quantity,
        0
      ),
    };
  });

  const totalBooksDistributed = tables.reduce(
    (sum, table) => sum + table.totalBooksGiven,
    0
  );
  const totalBooksReturned = tables.reduce(
    (sum, table) => sum + table.totalBooksReturned,
    0
  );

  // Get books returned to main store (from mini store closing)
  const booksReturnedToMainStore: Array<{
    title: string;
    quantity: number;
    price: number;
  }> = [];
  let isMiniStoreClosed = false;
  let closedAt: string | null = null;
  let closedBy: string | null = null;

  if (miniStoreSession.closingStock) {
    isMiniStoreClosed = true;
    const closingStock = miniStoreSession.closingStock as any;
    closedAt =
      miniStoreSession.closedAt?.toISOString() || closingStock.closedAt || null;
    closedBy = closingStock.closedBy || null;

    if (
      closingStock.remainingStock &&
      Array.isArray(closingStock.remainingStock)
    ) {
      closingStock.remainingStock.forEach((item: any) => {
        // Skip combo books - they should not be in inventory
        if (comboBookTitles.has(item.title)) return;
        
        booksReturnedToMainStore.push({
          title: item.title,
          quantity: item.quantity || 0,
          price: item.price || 0,
        });
      });
    }
  }

  const totalBooksReturnedToMainStore = booksReturnedToMainStore.reduce(
    (sum, book) => sum + book.quantity,
    0
  );

  return {
    tables: tables.sort((a, b) => a.tableId.localeCompare(b.tableId)),
    totalTables: tables.length,
    totalBooksDistributed,
    totalBooksReturned,
    isMiniStoreClosed,
    closedAt,
    closedBy,
    booksReturnedToMainStore,
    totalBooksReturnedToMainStore,
    isMainStore: false,
  };
}
