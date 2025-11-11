import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ session: string }> }
) {
  return auth(async (req) => {
    try {
      if (!req.auth || !req.auth.user) {
        return NextResponse.json(
          { message: 'Not authenticated' },
          { status: 401 }
        );
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: req.auth.user.id },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        return NextResponse.json(
          { message: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }

      const session = (await params)?.session;

      if (!session || session === 'All') {
        return NextResponse.json(
          { message: 'Invalid session parameter' },
          { status: 400 }
        );
      }

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Get all consolidations for this session
      const consolidations = await prisma.consolidation.findMany({
        where: { session },
        include: {
          items: {
            include: {
              book: true,
              order: true,
            },
          },
          user: {
            include: {
              mySessions: {
                where: {
                  session: session,
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
              },
            },
          },
        },
      });

      if (consolidations.length === 0) {
        return NextResponse.json(
          { message: 'No consolidations found for this session' },
          { status: 404 }
        );
      }

      // Get all product names to check for book mappings
      const allItems = consolidations.flatMap((c) => c.items);
      const productNames = allItems
        .filter((item) => item.isCollected)
        .map((item) => item.productName);

      const bookMappings = await prisma.bookMapping.findMany({
        where: {
          productName: {
            in: productNames,
          },
        },
        include: {
          book: true,
        },
      });

      const mappedProductNames = new Set(bookMappings.map((m) => m.productName));
      const mappingMap = new Map(
        bookMappings.map((m) => [m.productName, m.book])
      );

      // Group items by table session for efficient processing
      const itemsByTableSession = new Map<string, any[]>();

      for (const consolidation of consolidations) {
        const userSession = consolidation.user?.mySessions?.[0];
        const tableSaleSession = userSession?.preorderSession?.tableSaleSession;

        if (!tableSaleSession) {
          continue; // Skip if no table session
        }

        const tableSessionId = tableSaleSession.id;
        if (!itemsByTableSession.has(tableSessionId)) {
          itemsByTableSession.set(tableSessionId, []);
        }

        // Add items that should affect stock (have mappings)
        const itemsToReconcile = consolidation.items.filter((item: any) => {
          if (!item.isCollected) return false;
          return item.bookId || mappedProductNames.has(item.productName);
        });

        itemsByTableSession.get(tableSessionId)!.push(...itemsToReconcile);
      }

      // Process each table session
      let totalItemsReconciled = 0;
      const errors: string[] = [];

      for (const [tableSessionId, items] of itemsByTableSession.entries()) {
        const tableSaleSession = await prisma.tableSaleSession.findUnique({
          where: { id: tableSessionId },
        });

        if (!tableSaleSession) {
          errors.push(`Table session ${tableSessionId} not found`);
          continue;
        }

        let tableStock = [...((tableSaleSession.data as any)?.list || [])];

        // Process each item
        for (const item of items) {
          let bookId = item.bookId;
          let bookTitle = item.productName;

          // Get book mapping if bookId is not set
          if (!bookId) {
            const mapping = bookMappings.find((m) => m.productName === item.productName);
            if (mapping) {
              bookId = mapping.bookId;
              bookTitle = mapping.book.title;
            }
          } else if (item.book) {
            bookTitle = item.book.title;
          }

          // Deduct from table stock if we have a mapped book
          if (bookTitle && bookTitle !== item.productName) {
            const stockIndex = tableStock.findIndex(
              (stockItem: any) => stockItem.title === bookTitle
            );
            if (stockIndex >= 0) {
              if (tableStock[stockIndex].available < item.quantity) {
                errors.push(
                  `Insufficient stock for "${bookTitle}" in table ${tableSaleSession.tableId}. Available: ${tableStock[stockIndex].available}, Required: ${item.quantity}`
                );
                continue;
              }
              tableStock[stockIndex] = {
                ...tableStock[stockIndex],
                available: tableStock[stockIndex].available - item.quantity,
              };
            } else {
              errors.push(
                `Book "${bookTitle}" not found in table stock for table ${tableSaleSession.tableId}`
              );
            }
          }

          // Update global book quantities if we have a bookId
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
              // Handle combo books
              if (book.isCombo && book.comboItems.length > 0) {
                for (const comboItem of book.comboItems) {
                  const componentBook = comboItem.componentBook;
                  const quantityToDeduct = item.quantity * comboItem.quantity;

                  // Update table stock for component book
                  const componentStockIndex = tableStock.findIndex(
                    (stockItem: any) => stockItem.title === componentBook.title
                  );
                  if (componentStockIndex >= 0) {
                    if (
                      tableStock[componentStockIndex].available <
                      quantityToDeduct
                    ) {
                      errors.push(
                        `Insufficient stock for "${componentBook.title}" (component of "${bookTitle}") in table ${tableSaleSession.tableId}. Required: ${quantityToDeduct}, Available: ${tableStock[componentStockIndex].available}`
                      );
                      continue;
                    }
                    tableStock[componentStockIndex] = {
                      ...tableStock[componentStockIndex],
                      available:
                        tableStock[componentStockIndex].available -
                        quantityToDeduct,
                    };
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
                      errors.push(
                        `Insufficient global stock for component book "${componentBook.title}". Available: ${componentBookData.available}, Required: ${quantityToDeduct}`
                      );
                    }
                  }
                }
              } else {
                // Regular book - update global quantities
                const newPreorderAvailable = book.preorderAvailable - item.quantity;
                const newAvailable = book.available - item.quantity;

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
                  errors.push(
                    `Insufficient global stock for book "${bookTitle}". Available: ${book.available}, Required: ${item.quantity}`
                  );
                }
              }
            }
          }

          totalItemsReconciled++;
        }

        // Update table sale session with reconciled stock
        await prisma.tableSaleSession.update({
          where: { id: tableSessionId },
          data: {
            data: { list: tableStock },
          },
        });

        // Emit WebSocket event for stock update
        wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
          sessionId: tableSessionId,
          workspace: 'pre-order',
          tableId: tableSaleSession.tableId,
        });
      }

      if (errors.length > 0) {
        return NextResponse.json(
          {
            message: `Reconciliation completed with ${errors.length} error(s)`,
            errors,
            itemsReconciled: totalItemsReconciled,
          },
          { status: 207 } // Multi-Status
        );
      }

      return NextResponse.json({
        message: `Successfully reconciled ${totalItemsReconciled} item(s) for session ${session}`,
        itemsReconciled: totalItemsReconciled,
      });
    } catch (error: any) {
      console.error('Error reconciling consolidations:', error);
      return NextResponse.json(
        { message: 'Failed to reconcile consolidations', error: error.message },
        { status: 500 }
      );
    }
  })(request, {});
}

