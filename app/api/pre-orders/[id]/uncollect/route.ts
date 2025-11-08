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

      const order = await prisma.preOrder.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              consolidation: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          {
            message: `Order with id ${id} not found`,
          },
          {
            status: 404,
          }
        );
      }

      // Get the consolidation(s) that collected this order to find the table session
      const consolidations = await prisma.consolidation.findMany({
        where: {
          orderId: id,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Find the table session from the user who collected the order
      // Use the first consolidation's user, or try to find from any preorder user
      let tableSaleSession = null;
      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      if (consolidations.length > 0) {
        // Try to find the table session from the user who collected the order
        const consolidationUser = consolidations[0].user;
        const mySession = await prisma.mySession.findFirst({
          where: {
            userId: consolidationUser.id,
            session:
              consolidations[0].session || settings?.currentSession || '',
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

        tableSaleSession = mySession?.preorderSession?.tableSaleSession;
      }

      // Mark all items in the order as uncollected
      await prisma.orderItem.updateMany({
        where: {
          orderId: id,
        },
        data: {
          isCollected: false,
          consolidationId: null,
        },
      });

      // Update order status
      await prisma.preOrder.update({
        where: { id },
        data: {
          isCollected: false,
          isPartiallyCollected: false,
        },
      });

      // Get items that were collected before marking as uncollected
      const collectedItems = order.items.filter((item) => item.isCollected);

      // Prepare table stock update if we have a linked table
      let tableStock = tableSaleSession
        ? [...((tableSaleSession.data as any)?.list || [])]
        : null;

      // Restore stock for collected items only
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

        // Restore stock in table session if we have a linked table
        if (tableStock && bookTitle) {
          const stockIndex = tableStock.findIndex(
            (stockItem: any) => stockItem.title === bookTitle
          );
          if (stockIndex >= 0) {
            tableStock[stockIndex] = {
              ...tableStock[stockIndex],
              available: tableStock[stockIndex].available + item.quantity,
            };
          }
        }

        // Restore global book quantities (always restore, regardless of table session)
        if (item.bookId) {
          const book = await prisma.book.findUnique({
            where: { id: item.bookId },
            include: {
              comboItems: {
                include: {
                  componentBook: true,
                },
              },
            },
          });

          if (book) {
            // If it's a combo book, restore all linked component books
            if (book.isCombo && book.comboItems.length > 0) {
              for (const comboItem of book.comboItems) {
                const componentBook = comboItem.componentBook;
                const quantityToRestore = item.quantity * comboItem.quantity;

                // Restore table stock for component book if we have a linked table session
                if (tableStock && tableSaleSession) {
                  const componentStockIndex = tableStock.findIndex(
                    (stockItem: any) => stockItem.title === componentBook.title
                  );
                  if (componentStockIndex >= 0) {
                    tableStock[componentStockIndex] = {
                      ...tableStock[componentStockIndex],
                      available:
                        tableStock[componentStockIndex].available +
                        quantityToRestore,
                    };
                  }
                }

                // Restore global book quantities for component book
                await prisma.book.update({
                  where: { id: componentBook.id },
                  data: {
                    preorderAvailable: {
                      increment: quantityToRestore,
                    },
                    available: {
                      increment: quantityToRestore,
                    },
                  },
                });
              }
            } else {
              // Regular book - restore as before
              await prisma.book.update({
                where: { id: item.bookId },
                data: {
                  preorderAvailable: {
                    increment: item.quantity,
                  },
                  available: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }
        }
      }

      // Update table sale session with restored stock (once, after all items processed)
      if (tableSaleSession && tableStock) {
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

      return NextResponse.json({
        message: `Order with id ${id} has been marked as uncollected`,
      });
    } catch (error) {
      console.log({ error });

      return NextResponse.json(
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
