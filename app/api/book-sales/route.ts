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

      if (
        !customerInfo.fullName ||
        !customerInfo.email ||
        !items ||
        items.length === 0
      ) {
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

      console.log('Book sales API - session info:', {
        workspace: mySession.workspace,
        tableId: mySession.tableSaleSession.tableId,
        sessionId: mySession.tableSaleSession.id,
        managerId: mySession.tableSaleSession.managerId,
        salesPersonId: mySession.tableSaleSession.salesPersonId,
      });

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
        // Find the book in the database
        const book = await prisma.book.findFirst({
          where: { title: item.bookTitle },
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

        // Update table stock
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
    } catch (error) {
      console.error('Error creating book sale:', error);
      return NextResponse.json(
        { message: 'Failed to create sale' },
        { status: 500 }
      );
    }
  })(request, {});
}
