import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params)?.id;

  return auth(async (req) => {
    try {
      if (!req.auth || !req.auth.user) {
        return NextResponse.json(
          { message: 'Not authenticated' },
          { status: 401 }
        );
      }

      const body = await request.json();

      const currentSession = await prisma.setting.findFirst();

      const items = body.items;

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
          }
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
          }
        );
      }
      const existingItems = await prisma.orderItem.count({
        where: {
          orderId: id,
          isCollected: true,
        },
      });

      const isComplete = existingItems + items.length === order.items.length;

      console.log({ existingItems, isComplete });

      // update order status
      await prisma.preOrder.update({
        where: { id },
        data: { isCollected: !!isComplete, isPartiallyCollected: !isComplete },
      });

      const con = await prisma.consolidation.create({
        data: {
          orderId: id,
          userId: req.auth.user?.id || '',
          session: currentSession?.currentSession || 'SATURDAY_MORNING',
          date: new Date(),
        },
      });

      // Get the items that are being collected (not already collected)
      const itemsToCollect =
        existingItems > 0
          ? order.items.filter(
              (item) => items.includes(item.id) && !item.isCollected
            )
          : order.items.filter((item) => !item.isCollected);

      await prisma.orderItem.updateMany({
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

      // Get the user's preorder session to find the linked table session
      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user?.id || '',
          session: settings?.currentSession || '',
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
      let tableStock = tableSaleSession
        ? [...((tableSaleSession.data as any)?.list || [])]
        : [];

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

        // Update table stock if we have a linked table session
        // Always use the mapped book title (or book title if no mapping) for table stock deduction
        if (tableSaleSession && bookTitle && bookTitle !== item.productName) {
          const stockIndex = tableStock.findIndex(
            (stockItem: any) => stockItem.title === bookTitle
          );
          if (stockIndex >= 0) {
            if (tableStock[stockIndex].available < item.quantity) {
              return NextResponse.json(
                {
                  message: `Insufficient stock for "${bookTitle}". Available: ${tableStock[stockIndex].available}, Requested: ${item.quantity}`,
                },
                { status: 400 }
              );
            }
            tableStock[stockIndex] = {
              ...tableStock[stockIndex],
              available: tableStock[stockIndex].available - item.quantity,
            };
          } else {
            console.warn(
              `Book "${bookTitle}" (mapped from "${item.productName}") not found in table stock for preorder collection`
            );
          }
        } else if (tableSaleSession && !bookTitle) {
          // If we couldn't find a mapped book, log a warning
          console.warn(
            `No book mapping found for product "${item.productName}" - cannot deduct from table stock`
          );
        }

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
                    (stockItem: any) => stockItem.title === componentBook.title
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
                        { status: 400 }
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
                      `Insufficient global stock for component book ${componentBook.id}. PreorderAvailable: ${componentBookData.preorderAvailable}, Available: ${componentBookData.available}, Requested: ${quantityToDeduct}`
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
                  `Insufficient global stock for book ${bookId}. PreorderAvailable: ${book.preorderAvailable}, Available: ${book.available}, Requested: ${item.quantity}`
                );
              }
            }
          }
        }
      }

      // Update table sale session with new stock if we have a linked table session
      if (tableSaleSession) {
        await prisma.tableSaleSession.update({
          where: { id: tableSaleSession.id },
          data: {
            data: { list: tableStock },
          },
        });

        // Emit WebSocket event for stock update
        wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
          sessionId: tableSaleSession.id,
          workspace: 'pre-order',
          tableId: tableSaleSession.tableId,
        });
      }

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
        }
      );
    }
  })(request as any, { id } as any) as any;
}
