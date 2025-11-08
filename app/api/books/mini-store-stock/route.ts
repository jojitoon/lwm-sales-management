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
      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      const currentSession = settings?.currentSession as string;

      // Get the logged-in user's session (supports mini-store, preorder-ministore, and table-manager)
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: currentSession,
          workspace: { in: ['mini-store', 'preorder-ministore', 'table-manager'] },
          isActive: true,
        },
        include: {
          miniStoreSession: true,
          tableSaleSession: true,
        },
      });

      let miniStoreType: string;
      let targetMiniStore: any = null;

      if (mySession?.workspace === 'table-manager') {
        // For table managers, determine mini store type based on table type
        // Check both tableId (e.g., PREORDER-1) and data.tableType
        const tableId = mySession.tableSaleSession?.tableId || '';
        const dataTableType = (mySession.tableSaleSession?.data as any)?.tableType || '';
        
        // Check if tableId contains "preorder" (case-insensitive)
        const tableIdIsPreorder = tableId.toLowerCase().includes('preorder');
        // Check if data.tableType is "preorder"
        const dataTypeIsPreorder = dataTableType?.toLowerCase() === 'preorder';
        
        const isPreorderTable = tableIdIsPreorder || dataTypeIsPreorder;
        
        // Preorder table managers can ONLY request from preorder mini store
        // Regular table managers can ONLY request from regular mini store
        miniStoreType = isPreorderTable ? 'preorder' : 'regular';

        // Get the mini store session based on table type
        targetMiniStore = await prisma.miniStoreSession.findFirst({
          where: {
            session: currentSession,
            isActive: true,
            type: miniStoreType,
          },
        });
      } else {
        // For mini-store and preorder-ministore workspaces, use existing logic
        miniStoreType = mySession?.workspace === 'preorder-ministore' 
          ? 'preorder' 
          : 'regular';

        // Get the mini store session for the current user's session type
        const miniStore = await prisma.miniStoreSession.findFirst({
          where: {
            session: currentSession,
            isActive: true,
            type: miniStoreType,
          },
        });

        // If no mini store found, try to get the one from mySession
        targetMiniStore = miniStore || mySession?.miniStoreSession;
      }

      if (!targetMiniStore) {
        return NextResponse.json([]);
      }

      const stock = (targetMiniStore.data as any)?.list || [];

      // Get all combo books to filter them out
      const comboBooks = await prisma.book.findMany({
        where: { isCombo: true },
        select: { title: true },
      });
      const comboBookTitles = new Set(comboBooks.map((b) => b.title));

      // Filter out combo books from stock
      const filteredStock = stock.filter(
        (item: any) => !comboBookTitles.has(item.title)
      );

      return NextResponse.json(filteredStock);
    } catch (error) {
      console.error('Error fetching mini store stock:', error);
      return NextResponse.json(
        { message: 'Failed to fetch mini store stock' },
        { status: 500 }
      );
    }
  })(request, {});
}
