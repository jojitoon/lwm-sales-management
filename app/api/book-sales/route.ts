import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

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
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession as string,
          workspace: { in: ['table-manager', 'book-sales'] },
          isActive: true,
        },
        include: {
          tableSaleSession: true,
        },
      });

      if (!mySession?.tableSaleSession) {
        return NextResponse.json(
          { message: 'Table sale session not found' },
          { status: 404 }
        );
      }

      // Fetch book sales for this table sale session
      const tableSale = await prisma.tableSaleSession.findFirst({
        where: {
          id: mySession.tableSaleSession.id,
        },
        include: {
          bookSales: {
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
          },
        },
      });

      return NextResponse.json(tableSale?.bookSales || []);
    } catch (error) {
      console.error('Error fetching book sales:', error);
      return NextResponse.json(
        { message: 'Failed to fetch book sales' },
        { status: 500 }
      );
    }
  })(request, {});
}

export async function POST(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const { customerInfo, items, total } = await request.json();

      if (!customerInfo.fullName || !items || items.length === 0) {
        return NextResponse.json(
          { message: 'Invalid request data' },
          { status: 400 }
        );
      }

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Get current user's table sale session (works for both table-manager and book-sales)
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession as string,
          workspace: { in: ['table-manager', 'book-sales'] },
          isActive: true,
        },
        include: {
          tableSaleSession: true,
        },
      });

      if (!mySession?.tableSaleSession) {
        return NextResponse.json(
          { message: 'Table sale session not found' },
          { status: 404 }
        );
      }

      // Use the shared table sale session for stock updates
      const stockUpdateSession = mySession.tableSaleSession;

      // Check if stock is closed
      const sessionData = (stockUpdateSession.data as any) || {};
      if (sessionData.closingStock) {
        return NextResponse.json(
          {
            message:
              'Stock has been closed for this table session. No new sales can be made.',
          },
          { status: 400 }
        );
      }

      console.log('Book sales API - session info:', {
        workspace: mySession.workspace,
        tableId: mySession.tableSaleSession.tableId,
        sessionId: mySession.tableSaleSession.id,
        managerId: mySession.tableSaleSession.managerId,
        salesPersonId: mySession.tableSaleSession.salesPersonId,
      });

      // Check if slip number is provided and if it already exists
      if (customerInfo.slipNumber) {
        const existingSale = await prisma.bookSale.findFirst({
          where: { slipNumber: customerInfo.slipNumber },
          select: { id: true, orderNumber: true },
        });

        if (existingSale) {
          return NextResponse.json(
            {
              message: `Slip number "${customerInfo.slipNumber}" already exists. Please use a different slip number.`,
            },
            { status: 400 }
          );
        }
      }

      // Generate order number
      const orderNumber = `BS-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create book sale
      const bookSale = await prisma.bookSale.create({
        data: {
          orderNumber,
          fullName: customerInfo.fullName,
          email: customerInfo.email,
          phoneNumber: customerInfo.phoneNumber || null,
          customerLocation: customerInfo.customerLocation || null,
          slipNumber: customerInfo.slipNumber || null,
          total,
          sessionId: mySession.tableSaleSession.id, // Use the sales person's session for the sale record
          purchasedAt: new Date(),
        },
      });

      // Create book sale items and update stock
      const tableStock = (stockUpdateSession.data as any)?.list || [];
      const updatedStock = [...tableStock];

      for (const item of items) {
        // Find the book in the database with combo items
        const book = await prisma.book.findFirst({
          where: { title: item.bookTitle },
          include: {
            comboItems: {
              include: {
                componentBook: true,
              },
            },
          },
        });

        if (!book) {
          return NextResponse.json(
            { message: `Book "${item.bookTitle}" not found` },
            { status: 400 }
          );
        }

        // Create book sale item
        await prisma.bookSaleItem.create({
          data: {
            bookSaleId: bookSale.id,
            bookId: book.id,
            quantity: item.quantity,
            price: item.price,
          },
        });

        // If it's a combo book, update all linked component books
        if (book.isCombo && book.comboItems.length > 0) {
          for (const comboItem of book.comboItems) {
            const componentBook = comboItem.componentBook;
            const quantityToDeduct = item.quantity * comboItem.quantity;

            // Check and update table stock for component book
            const componentStockIndex = updatedStock.findIndex(
              (stockItem: any) => stockItem.title === componentBook.title
            );
            if (componentStockIndex >= 0) {
              if (
                updatedStock[componentStockIndex].available < quantityToDeduct
              ) {
                return NextResponse.json(
                  {
                    message: `Insufficient stock for "${componentBook.title}" (component of "${item.bookTitle}"). Required: ${quantityToDeduct}, Available: ${updatedStock[componentStockIndex].available}`,
                  },
                  { status: 400 }
                );
              }
              updatedStock[componentStockIndex] = {
                ...updatedStock[componentStockIndex],
                available:
                  updatedStock[componentStockIndex].available -
                  quantityToDeduct,
              };
            } else {
              // Component book not in table stock, but we should still check global stock
              const globalBook = await prisma.book.findUnique({
                where: { id: componentBook.id },
                select: { available: true, salesAvailable: true },
              });

              if (
                !globalBook ||
                globalBook.available < quantityToDeduct ||
                globalBook.salesAvailable < quantityToDeduct
              ) {
                return NextResponse.json(
                  {
                    message: `Insufficient global stock for "${componentBook.title}" (component of "${item.bookTitle}"). Required: ${quantityToDeduct}`,
                  },
                  { status: 400 }
                );
              }
            }
          }
        } else {
          // Regular book - update table stock as before
          const stockIndex = updatedStock.findIndex(
            (stockItem: any) => stockItem.title === item.bookTitle
          );
          if (stockIndex >= 0) {
            if (updatedStock[stockIndex].available < item.quantity) {
              return NextResponse.json(
                { message: `Insufficient stock for "${item.bookTitle}"` },
                { status: 400 }
              );
            }
            updatedStock[stockIndex] = {
              ...updatedStock[stockIndex],
              available: updatedStock[stockIndex].available - item.quantity,
            };
          }
        }
      }

      // Update table sale session with new stock
      await prisma.tableSaleSession.update({
        where: { id: stockUpdateSession.id },
        data: {
          data: { list: updatedStock },
        },
      });

      // Emit WebSocket events
      wsEmitter.emit(WebSocketEvents.BOOK_SALE_CREATED, {
        saleId: bookSale.id,
        orderNumber: bookSale.orderNumber,
        total: bookSale.total,
        items: items.map((item: any) => ({
          bookTitle: item.bookTitle,
          quantity: item.quantity,
          price: item.price,
        })),
        sessionId: stockUpdateSession.id,
        workspace: mySession.workspace,
      });

      wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
        sessionId: stockUpdateSession.id,
        workspace: mySession.workspace,
        updatedStock,
      });

      return NextResponse.json({
        message: 'Sale completed successfully',
        sale: bookSale,
      });
    } catch (error: any) {
      console.error('Error creating book sale:', error);

      // Handle unique constraint violation for slip number
      if (
        error?.code === 'P2002' &&
        error?.meta?.target?.includes('slipNumber')
      ) {
        return NextResponse.json(
          {
            message: `Slip number already exists. Please use a different slip number.`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: 'Failed to create sale' },
        { status: 500 }
      );
    }
  })(request, {});
}
