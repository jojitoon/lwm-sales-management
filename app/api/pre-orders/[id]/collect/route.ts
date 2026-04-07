import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params)?.id;

  return auth(async (req) => {
    try {
      if (!req.auth || !req.auth.user) {
        return NextResponse.json(
          { message: 'Not authenticated' },
          { status: 401 },
        );
      }

      // Admin should be able to view but not confirm/collect.
      if ((req.auth.user as any)?.isAdmin) {
        return NextResponse.json(
          { message: 'Admins cannot confirm/collect pre-orders. View-only.' },
          { status: 403 },
        );
      }

      const body = await request.json();

      const items = body.items;

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });
      const sessionName = settings?.currentSession || '';

      const order = await prisma.preOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) {
        return Response.json(
          {
            message: `Order with id ${id} not found`,
          },
          {
            status: 404,
          },
        );
      }

      console.log({ items }, order.items.length);

      // return error
      if (order.isCollected) {
        return Response.json(
          {
            message: `Order with id ${id} has already been collected`,
          },
          {
            status: 400,
          },
        );
      }
      const existingItems = await prisma.orderItem.count({
        where: {
          orderId: id,
          isCollected: true,
        },
      });

      // Get the items that are being collected (not already collected)
      const itemsToCollect =
        existingItems > 0
          ? order.items.filter(
              (item) => items.includes(item.id) && !item.isCollected,
            )
          : order.items.filter((item) => !item.isCollected);

      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user?.id || '',
          session: sessionName,
          workspace: 'pre-order',
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

      const tableSaleSession = mySession?.preorderSession?.tableSaleSession;
      if (!tableSaleSession || !tableSaleSession.isActive) {
        return NextResponse.json(
          {
            message:
              'No active preorder table manager stock is linked. Please link a table session and stock it up before confirming.',
          },
          { status: 400 },
        );
      }

      const tableStock: any[] = [
        ...(((tableSaleSession.data as any)?.list as any[]) || []),
      ];

      // 1) Build required deductions per table-stock title (includes combo component books).
      const requiredByTitle = new Map<string, number>();
      const itemBookIdUpdates: { orderItemId: string; bookId: string }[] = [];

      for (const item of itemsToCollect) {
        // Map preorder "productName" -> Book (preferred) to ensure table stock matches real book titles.
        let mappedBookId: string | null = item.bookId ?? null;
        let mappedBookTitle: string | null = null;

        const mapping = await prisma.bookMapping.findUnique({
          where: { productName: item.productName },
          include: { book: true },
        });
        if (mapping?.book) {
          mappedBookId = mapping.bookId;
          mappedBookTitle = mapping.book.title;
          if (!item.bookId) {
            itemBookIdUpdates.push({
              orderItemId: item.id,
              bookId: mapping.bookId,
            });
          }
        } else if (mappedBookId) {
          const b = await prisma.book.findUnique({
            where: { id: mappedBookId },
            select: { title: true },
          });
          mappedBookTitle = b?.title ?? null;
        }

        // If we can't map to a book title, we cannot safely deduct from table stock.
        if (!mappedBookTitle) {
          return NextResponse.json(
            {
              message: `Cannot confirm "${item.productName}" because it is not mapped to a book title for table stock deduction. Please map it and stock up.`,
            },
            { status: 400 },
          );
        }

        const book = mappedBookId
          ? await prisma.book.findUnique({
              where: { id: mappedBookId },
              include: { comboItems: { include: { componentBook: true } } },
            })
          : null;

        // Combo books deduct component titles, otherwise deduct the mapped title.
        if (book?.isCombo && book.comboItems.length > 0) {
          for (const comboItem of book.comboItems) {
            const titleKey = normalizeTitle(comboItem.componentBook.title);
            requiredByTitle.set(
              titleKey,
              (requiredByTitle.get(titleKey) ?? 0) +
                item.quantity * comboItem.quantity,
            );
          }
        } else {
          const titleKey = normalizeTitle(mappedBookTitle);
          requiredByTitle.set(
            titleKey,
            (requiredByTitle.get(titleKey) ?? 0) + item.quantity,
          );
        }
      }

      // 2) Validate the linked table manager has sufficient stock for every required title.
      for (const [titleKey, requiredQty] of requiredByTitle.entries()) {
        const stockRow = tableStock.find(
          (s: any) => normalizeTitle(String(s.title ?? '')) === titleKey,
        );
        const available = Number(stockRow?.available ?? 0);
        if (!stockRow) {
          return NextResponse.json(
            {
              message: `Table stock is missing "${titleKey}". Please stock up before confirming.`,
            },
            { status: 400 },
          );
        }
        if (available < requiredQty) {
          return NextResponse.json(
            {
              message: `Insufficient table stock for "${stockRow.title}". Available: ${available}, Required: ${requiredQty}. Please stock up.`,
            },
            { status: 400 },
          );
        }
      }

      // 3) Apply deductions in-memory now that we know it's safe.
      for (const [titleKey, requiredQty] of requiredByTitle.entries()) {
        const idx = tableStock.findIndex(
          (s: any) => normalizeTitle(String(s.title ?? '')) === titleKey,
        );
        tableStock[idx] = {
          ...tableStock[idx],
          available: Number(tableStock[idx].available ?? 0) - requiredQty,
        };
      }

      const isComplete =
        existingItems + itemsToCollect.length === order.items.length;

      // 4) Commit updates atomically.
      await prisma.$transaction(async (tx) => {
        await tx.preOrder.update({
          where: { id },
          data: {
            isCollected: !!isComplete,
            isPartiallyCollected: !isComplete,
          },
        });

        const con = await tx.consolidation.create({
          data: {
            orderId: id,
            userId: req.auth?.user?.id || '',
            session: sessionName || 'SATURDAY_MORNING',
            date: new Date(),
          },
        });

        // Persist any missing bookId mappings for future confirmations.
        for (const u of itemBookIdUpdates) {
          await tx.orderItem.update({
            where: { id: u.orderItemId },
            data: { bookId: u.bookId },
          });
        }

        await tx.orderItem.updateMany({
          where: {
            orderId: id,
            ...(existingItems > 0
              ? {
                  id: {
                    in: items,
                  },
                }
              : {}),
          },
          data: { isCollected: true, consolidationId: con.id },
        });

        await tx.tableSaleSession.update({
          where: { id: tableSaleSession.id },
          data: {
            data: { list: tableStock },
          },
        });
      });

      // Update book quantities for collected items
      for (const item of itemsToCollect) {
        let bookId = item.bookId;
        let bookTitle = item.productName;

        // Always try to get the mapped book first, even if bookId is set
        // This ensures we use the correct mapped book for table stock deduction
        const mapping = await prisma.bookMapping.findUnique({
          where: { productName: item.productName },
          include: { book: true },
        });

        if (mapping && mapping.book) {
          // Use the mapped book
          bookId = mapping.bookId;
          bookTitle = mapping.book.title;

          // Update the orderItem with the bookId for future reference if not already set
          if (!item.bookId) {
            await prisma.orderItem.update({
              where: { id: item.id },
              data: { bookId },
            });
          }
        } else if (bookId) {
          // If no mapping but bookId exists, get the book title from the book
          const book = await prisma.book.findUnique({
            where: { id: bookId },
            select: { title: true },
          });
          if (book) {
            bookTitle = book.title;
          }
        }

        // Table-stock deduction is handled upfront (validated + applied atomically). No-op here.

        // If we have a bookId, update the global book quantities
        if (bookId) {
          const book = await prisma.book.findUnique({
            where: { id: bookId },
            include: {
              comboItems: {
                include: {
                  componentBook: true,
                },
              },
            },
          });

          if (book) {
            // If it's a combo book, update all linked component books
            if (book.isCombo && book.comboItems.length > 0) {
              for (const comboItem of book.comboItems) {
                const componentBook = comboItem.componentBook;
                const quantityToDeduct = item.quantity * comboItem.quantity;

                // Update table stock for component book if we have a linked table session
                if (tableSaleSession) {
                  const componentStockIndex = tableStock.findIndex(
                    (stockItem: any) => stockItem.title === componentBook.title,
                  );
                  if (componentStockIndex >= 0) {
                    if (
                      tableStock[componentStockIndex].available <
                      quantityToDeduct
                    ) {
                      return NextResponse.json(
                        {
                          message: `Insufficient stock for "${componentBook.title}" (component of "${bookTitle}"). Required: ${quantityToDeduct}, Available: ${tableStock[componentStockIndex].available}`,
                        },
                        { status: 400 },
                      );
                    }
                    tableStock[componentStockIndex] = {
                      ...tableStock[componentStockIndex],
                      available:
                        tableStock[componentStockIndex].available -
                        quantityToDeduct,
                    };
                  }
                }

                // Update global book quantities for component book
                const componentBookData = await prisma.book.findUnique({
                  where: { id: componentBook.id },
                  select: {
                    preorderAvailable: true,
                    available: true,
                  },
                });

                if (componentBookData) {
                  const newPreorderAvailable =
                    componentBookData.preorderAvailable - quantityToDeduct;
                  const newAvailable =
                    componentBookData.available - quantityToDeduct;

                  if (newPreorderAvailable >= 0 && newAvailable >= 0) {
                    await prisma.book.update({
                      where: { id: componentBook.id },
                      data: {
                        preorderAvailable: {
                          decrement: quantityToDeduct,
                        },
                        available: {
                          decrement: quantityToDeduct,
                        },
                      },
                    });
                  } else {
                    console.warn(
                      `Insufficient global stock for component book ${componentBook.id}. PreorderAvailable: ${componentBookData.preorderAvailable}, Available: ${componentBookData.available}, Requested: ${quantityToDeduct}`,
                    );
                  }
                }
              }
            } else {
              // Regular book - update as before
              const newPreorderAvailable =
                book.preorderAvailable - item.quantity;
              const newAvailable = book.available - item.quantity;

              // Prevent negative quantities
              if (newPreorderAvailable >= 0 && newAvailable >= 0) {
                await prisma.book.update({
                  where: { id: bookId },
                  data: {
                    preorderAvailable: {
                      decrement: item.quantity,
                    },
                    available: {
                      decrement: item.quantity,
                    },
                  },
                });
              } else {
                console.warn(
                  `Insufficient global stock for book ${bookId}. PreorderAvailable: ${book.preorderAvailable}, Available: ${book.available}, Requested: ${item.quantity}`,
                );
              }
            }
          }
        }
      }

      // Emit WebSocket event for stock update
      wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
        sessionId: tableSaleSession.id,
        workspace: 'pre-order',
        tableId: tableSaleSession.tableId,
      });

      return Response.json({
        message: `Order with id ${id} has been collected`,
      });
    } catch (error) {
      console.log({ error });

      return Response.json(
        {
          message: 'Internal Server Error. Please try again later.',
        },
        {
          status: 500,
        },
      );
    }
  })(request as any, { id } as any) as any;
}
