import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return auth(async (req) => {
    try {
      if (!req.auth || !req.auth.user || !(req.auth.user as any)?.isAdmin) {
        return NextResponse.json(
          { message: 'Not authorized' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const session = searchParams.get('session') || '';

      if (!session) {
        return NextResponse.json(
          { message: 'Session parameter is required' },
          { status: 400 }
        );
      }

      // Determine if we're fetching all sessions or a specific one
      const isAllSessions = session.toLowerCase() === 'all';

      // Get all sales for this session(s)
      const bookSales = await prisma.bookSale.findMany({
        where: isAllSessions
          ? {} // No filter for all sessions
          : {
          session: {
            session: session,
          },
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
          session: {
            select: {
              tableId: true,
              name: true,
              data: true,
              session: true, // Include session name for all sessions view
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Helper function to extract table type from tableId or data
      const getTableType = (tableId: string, data: any): string => {
        // Check if tableId follows the pattern TYPE-NUMBER (e.g., POS-1, TRF-2)
        const match = tableId.match(/^([A-Z]+)-\d+$/i);
        if (match) {
          const type = match[1].toUpperCase();
          // Normalize common variations
          if (type === 'TRF' || type === 'TRANSFER') return 'TRANSFER';
          if (type === 'POS') return 'POS';
          return type;
        }
        
        // Fallback to data.tableType if available
        if (data && typeof data === 'object' && (data as any).tableType) {
          const type = (data as any).tableType.toUpperCase();
          if (type === 'TRF' || type === 'TRANSFER') return 'TRANSFER';
          if (type === 'POS') return 'POS';
          return type;
        }
        
        // Default to 'UNKNOWN' if we can't determine
        return 'UNKNOWN';
      };

      // Calculate total sales
      const totalSales = bookSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalItemsSold = bookSales.reduce(
        (sum, sale) =>
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      );

      // Group sales by table type (POS, TRANSFER, etc.)
      const salesByTableType: Record<
        string,
        {
          tableType: string;
          totalSales: number;
          totalItems: number;
          transactionCount: number;
          tables: string[];
          booksSold: Record<
            string,
            {
              title: string;
              quantity: number;
              value: number;
            }
          >;
        }
      > = {};

      // Track component book deductions for combo books
      const componentBookDeductions: Record<string, Record<string, number>> = {};

      bookSales.forEach((sale) => {
        const tableId = sale.session?.tableId || 'Unknown';
        const tableName = sale.session?.name || tableId;
        const tableType = getTableType(tableId, sale.session?.data);

        // Initialize table type group if it doesn't exist
        if (!salesByTableType[tableType]) {
          salesByTableType[tableType] = {
            tableType,
            totalSales: 0,
            totalItems: 0,
            transactionCount: 0,
            tables: [],
            booksSold: {},
          };
          componentBookDeductions[tableType] = {};
        }

        // Add table to list if not already present
        if (!salesByTableType[tableType].tables.includes(tableId)) {
          salesByTableType[tableType].tables.push(tableId);
        }

        // Add to totals
        salesByTableType[tableType].totalSales += sale.total;
        salesByTableType[tableType].transactionCount += 1;

        // Process items and track books sold
        sale.items.forEach((item) => {
          const book = item.book;
          const bookTitle = book.title;
          const quantity = item.quantity;
          const value = item.price * quantity;
          const isCombo = book.isCombo || false;

          // Add to total items
          salesByTableType[tableType].totalItems += quantity;

          // If it's a combo book, track component book deductions
          if (isCombo && book.comboItems) {
            book.comboItems.forEach((comboItem) => {
              const componentTitle = comboItem.componentBook.title;
              const componentQuantity = quantity * comboItem.quantity;
              
              if (!componentBookDeductions[tableType][componentTitle]) {
                componentBookDeductions[tableType][componentTitle] = 0;
              }
              componentBookDeductions[tableType][componentTitle] += componentQuantity;
            });
          }

          // Add to books sold map (combo books are included)
          if (!salesByTableType[tableType].booksSold[bookTitle]) {
            salesByTableType[tableType].booksSold[bookTitle] = {
              title: bookTitle,
              quantity: 0,
              value: 0,
            };
          }
          salesByTableType[tableType].booksSold[bookTitle].quantity += quantity;
          salesByTableType[tableType].booksSold[bookTitle].value += value;
        });
      });

      // Deduct component book quantities that were sold as part of combos
      Object.keys(salesByTableType).forEach((tableType) => {
        Object.keys(componentBookDeductions[tableType]).forEach((componentTitle) => {
          if (salesByTableType[tableType].booksSold[componentTitle]) {
            salesByTableType[tableType].booksSold[componentTitle].quantity -=
              componentBookDeductions[tableType][componentTitle];
            // Recalculate value
            const pricePerUnit =
              salesByTableType[tableType].booksSold[componentTitle].value /
              (salesByTableType[tableType].booksSold[componentTitle].quantity +
                componentBookDeductions[tableType][componentTitle]);
            salesByTableType[tableType].booksSold[componentTitle].value =
              salesByTableType[tableType].booksSold[componentTitle].quantity * pricePerUnit;

            // Remove if quantity becomes 0 or negative
            if (salesByTableType[tableType].booksSold[componentTitle].quantity <= 0) {
              delete salesByTableType[tableType].booksSold[componentTitle];
            }
          }
        });
      });

      // Convert booksSold to array and sort by value
      Object.keys(salesByTableType).forEach((tableType) => {
        const booksSoldArray = Object.values(salesByTableType[tableType].booksSold).sort(
          (a, b) => b.value - a.value
        );
        (salesByTableType[tableType] as any).booksSold = booksSoldArray;
      });

      // Also keep the original salesByTable for backward compatibility
      const salesByTable: Record<
        string,
        {
          tableId: string;
          tableName: string;
          session: string;
          totalSales: number;
          totalItems: number;
          transactionCount: number;
          sales: typeof bookSales;
        }
      > = {};

      bookSales.forEach((sale) => {
        // Get session info from the sale's session relation
        const saleSession = (sale as any).session?.session || 'Unknown';
        const tableId = sale.session?.tableId || 'Unknown';
        const tableName = sale.session?.name || tableId;
        
        // For all sessions view, include session in the key to separate tables from different sessions
        const tableKey = isAllSessions ? `${saleSession}::${tableId}` : tableId;
        const displayTableName = isAllSessions ? `${tableName} (${saleSession})` : tableName;

        if (!salesByTable[tableKey]) {
          salesByTable[tableKey] = {
            tableId: tableKey,
            tableName: displayTableName,
            session: saleSession,
            totalSales: 0,
            totalItems: 0,
            transactionCount: 0,
            sales: [],
          };
        }

        salesByTable[tableKey].totalSales += sale.total;
        salesByTable[tableKey].totalItems += sale.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        salesByTable[tableKey].transactionCount += 1;
        salesByTable[tableKey].sales.push(sale);
      });

      // Get stock movements: Main Store -> Mini Store
      const mainStoreRequests = await prisma.mainStoreRequest.findMany({
        where: {
          wasApproved: true,
          ...(isAllSessions
            ? {}
            : {
          mainStoreSession: {
            session: session,
          },
              }),
        },
        include: {
          mainStoreSession: {
            select: {
              id: true,
              name: true,
            },
          },
          miniStoreSession: {
            select: {
              id: true,
            },
          },
        },
      });

      const stockMainToMini: Array<{
        from: string;
        to: string;
        items: Array<{ title: string; quantity: number; price: number }>;
        totalQuantity: number;
        totalValue: number;
        date: Date;
      }> = [];

      mainStoreRequests.forEach((request) => {
        // Use granted data (what was actually given) instead of request data
        const grantedData = request.granted as any;
        const items = grantedData.items || [];
        const totalQuantity = items.reduce(
          (sum: number, item: any) => sum + (item.quantity || 0),
          0
        );
        const totalValue = items.reduce(
          (sum: number, item: any) =>
            sum + (item.quantity || 0) * (item.price || 0),
          0
        );

        stockMainToMini.push({
          from: request.mainStoreSession.name || 'Main Store',
          to: 'Mini Store',
          items: items.map((item: any) => ({
            title: item.bookTitle,
            quantity: item.quantity || 0,
            price: item.price || 0,
          })),
          totalQuantity,
          totalValue,
          date: request.createdAt,
        });
      });

      // Get stock movements: Mini Store -> Table
      const miniStoreRequests = await prisma.miniStoreRequest.findMany({
        where: {
          wasApproved: true,
          tableSaleSessionId: { not: null },
          ...(isAllSessions
            ? {}
            : {
                miniStoreSession: {
                  session: session,
                },
              }),
        },
        include: {
          miniStoreSession: {
            select: {
              id: true,
            },
          },
          tableSaleSession: {
            select: {
              tableId: true,
              name: true,
            },
          },
        },
      });

      const stockMiniToTable: Array<{
        from: string;
        to: string;
        tableId: string;
        items: Array<{ title: string; quantity: number; price: number }>;
        totalQuantity: number;
        totalValue: number;
        date: Date;
      }> = [];

      miniStoreRequests.forEach((request) => {
        if (!request.tableSaleSession) return;

        // Use granted data (what was actually given) instead of request data
        const grantedData = request.granted as any;
        const items = grantedData.items || [];
        const totalQuantity = items.reduce(
          (sum: number, item: any) => sum + (item.quantity || 0),
          0
        );
        const totalValue = items.reduce(
          (sum: number, item: any) =>
            sum + (item.quantity || 0) * (item.price || 0),
          0
        );

        stockMiniToTable.push({
          from: 'Mini Store',
          to: request.tableSaleSession.name || request.tableSaleSession.tableId,
          tableId: request.tableSaleSession.tableId,
          items: items.map((item: any) => ({
            title: item.bookTitle,
            quantity: item.quantity || 0,
            price: item.price || 0,
          })),
          totalQuantity,
          totalValue,
          date: request.createdAt,
        });
      });

      // Get all closing stocks
      const tableSaleSessions = await prisma.tableSaleSession.findMany({
        where: isAllSessions
          ? {}
          : {
              session: session,
            },
        select: {
          id: true,
          tableId: true,
          name: true,
          data: true,
        },
      });

      const miniStoreSessions = await prisma.miniStoreSession.findMany({
        where: isAllSessions
          ? {}
          : {
              session: session,
            },
        select: {
          id: true,
          closingStock: true,
          closedAt: true,
        },
      });

      const mainStoreSessions = await prisma.mainStoreSession.findMany({
        where: isAllSessions
          ? {}
          : {
              session: session,
            },
        select: {
          id: true,
          name: true,
          closingStock: true,
          closedAt: true,
        },
      });

      const closingStocks: Array<{
        type: 'table-manager' | 'mini-store' | 'main-store';
        name: string;
        tableId?: string;
        closedAt: Date | null;
        closedBy?: string;
        remainingStock: Array<{ title: string; quantity: number; price: number }>;
        totalQuantity: number;
        totalValue: number;
      }> = [];

      // Table manager closing stocks
      tableSaleSessions.forEach((session) => {
        const data = session.data as any;
        if (data?.closingStock) {
          const closingStock = data.closingStock;
          const remainingStock = closingStock.remainingStock || [];
          const totalQuantity = remainingStock.reduce(
            (sum: number, item: any) => sum + (item.quantity || 0),
            0
          );
          const totalValue = remainingStock.reduce(
            (sum: number, item: any) =>
              sum + (item.quantity || 0) * (item.price || 0),
            0
          );

          closingStocks.push({
            type: 'table-manager',
            name: session.name || session.tableId,
            tableId: session.tableId,
            closedAt: closingStock.closedAt
              ? new Date(closingStock.closedAt)
              : null,
            closedBy: closingStock.closedBy,
            remainingStock: remainingStock.map((item: any) => ({
              title: item.title,
              quantity: item.quantity || 0,
              price: item.price || 0,
            })),
            totalQuantity,
            totalValue,
          });
        }
      });

      // Mini store closing stocks
      miniStoreSessions.forEach((session) => {
        if (session.closingStock) {
          const closingStock = session.closingStock as any;
          const remainingStock = closingStock.remainingStock || [];
          const totalQuantity = remainingStock.reduce(
            (sum: number, item: any) => sum + (item.quantity || 0),
            0
          );
          const totalValue = remainingStock.reduce(
            (sum: number, item: any) =>
              sum + (item.quantity || 0) * (item.price || 0),
            0
          );

          closingStocks.push({
            type: 'mini-store',
            name: 'Mini Store',
            closedAt: session.closedAt,
            closedBy: closingStock.closedBy,
            remainingStock: remainingStock.map((item: any) => ({
              title: item.title,
              quantity: item.quantity || 0,
              price: item.price || 0,
            })),
            totalQuantity,
            totalValue,
          });
        }
      });

      // Main store closing stocks
      mainStoreSessions.forEach((session) => {
        if (session.closingStock) {
          const closingStock = session.closingStock as any;
          const remainingStock = closingStock.remainingStock || [];
          const totalQuantity = remainingStock.reduce(
            (sum: number, item: any) => sum + (item.quantity || 0),
            0
          );
          const totalValue = remainingStock.reduce(
            (sum: number, item: any) =>
              sum + (item.quantity || 0) * (item.price || 0),
            0
          );

          closingStocks.push({
            type: 'main-store',
            name: session.name || 'Main Store',
            closedAt: session.closedAt,
            closedBy: closingStock.closedBy,
            remainingStock: remainingStock.map((item: any) => ({
              title: item.title,
              quantity: item.quantity || 0,
              price: item.price || 0,
            })),
            totalQuantity,
            totalValue,
          });
        }
      });

      // Get preorders for this session(s)
      const consolidations = await prisma.consolidation.findMany({
        where: isAllSessions
          ? {}
          : {
              session: session,
            },
        include: {
          order: {
            include: {
              items: {
                include: {
                  book: true,
                },
              },
            },
          },
          items: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Process preorders
      const preorders = consolidations
        .filter((cons) => cons.order !== null)
        .map((cons) => {
          const order = cons.order!;
          const totalItems = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            fullName: order.fullName,
            email: order.email,
            phoneNumber: order.phoneNumber,
            shippingZone: order.shippingZone,
            total: order.total,
            isCollected: order.isCollected,
            isPartiallyCollected: order.isPartiallyCollected,
            orderStatus: order.orderStatus,
            purchasedAt: order.purchasedAt,
            createdAt: order.createdAt,
            session: cons.session, // Include session info
            processedBy: cons.user?.name || cons.user?.email || 'Unknown',
            processedAt: cons.createdAt,
            items: order.items.map((item) => ({
              id: item.id,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              isCollected: item.isCollected,
              book: item.book
                ? {
                    id: item.book.id,
                    title: item.book.title,
                  }
                : null,
            })),
          };
        });

      const totalPreorders = preorders.length;
      const totalPreorderItems = preorders.reduce(
        (sum, order) =>
          sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      );
      const totalPreorderValue = preorders.reduce((sum, order) => sum + order.total, 0);
      const collectedPreorders = preorders.filter((order) => order.isCollected).length;
      const pendingPreorders = totalPreorders - collectedPreorders;

      return NextResponse.json({
        session,
        summary: {
          totalSales,
          totalItemsSold,
          totalTransactions: bookSales.length,
          totalTables: Object.keys(salesByTable).length,
          totalPreorders,
          totalPreorderItems,
          totalPreorderValue,
          collectedPreorders,
          pendingPreorders,
        },
        salesByTable: Object.values(salesByTable),
        salesByTableType: Object.values(salesByTableType),
        stockMovements: {
          mainToMini: stockMainToMini,
          miniToTable: stockMiniToTable,
        },
        closingStocks,
        preorders,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      return NextResponse.json(
        { message: 'Failed to generate reconciliation report' },
        { status: 500 }
      );
    }
  })(request, {});
}

