import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

export async function PATCH(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const { id, quantity } = await request.json();

      // Get the book before updating to get the title
      const bookBeforeUpdate = await prisma.book.findUnique({
        where: { id },
      });

      if (!bookBeforeUpdate) {
        return NextResponse.json(
          { message: 'Book not found' },
          { status: 404 }
        );
      }

      // Update the book
      const book = await prisma.book.update({
        where: { id },
        data: {
          total: {
            increment: quantity,
          },
          available: {
            increment: quantity,
          },
        },
      });

      // Update main store session stock to match
      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      if (settings?.currentSession) {
        const mainStoreSession = await prisma.mainStoreSession.findFirst({
          where: {
            session: settings.currentSession as string,
            isActive: true,
          },
        });

        if (mainStoreSession) {
          const mainStoreStock = (mainStoreSession.data as any)?.list || [];

          // Find the book in main store stock and update it
          const bookIndex = mainStoreStock.findIndex(
            (item: any) => item.title === bookBeforeUpdate.title
          );

          if (bookIndex >= 0) {
            // Book exists in main store stock, update it
            mainStoreStock[bookIndex] = {
              ...mainStoreStock[bookIndex],
              total: mainStoreStock[bookIndex].total + quantity,
              available: mainStoreStock[bookIndex].available + quantity,
            };
          } else {
            // Book doesn't exist in main store stock, add it
            // Only add if it's not a combo book
            if (!bookBeforeUpdate.isCombo) {
              mainStoreStock.push({
                title: book.title,
                price: book.price,
                total: book.total,
                available: book.available,
                distributed: 0,
              });
            }
          }

          // Update the main store session
          await prisma.mainStoreSession.update({
            where: { id: mainStoreSession.id },
            data: {
              data: { list: mainStoreStock },
            },
          });

          // Emit WebSocket event to notify clients
          wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
            sessionId: mainStoreSession.id,
            workspace: 'main-store',
          });
        }
      }

      return NextResponse.json({ message: 'Book updated', book });
    } catch (error: any) {
      console.error('Error updating book quantity:', error);
      return NextResponse.json(
        { message: 'Failed to update book quantity' },
        { status: 500 }
      );
    }
  })(request, {});
}
