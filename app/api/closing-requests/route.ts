import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

function normalizeRemainingStock(list: any[]) {
  return (list || [])
    .filter((b: any) => Number(b?.available || 0) > 0)
    .map((b: any) => ({
      title: String(b.title),
      quantity: Number(b.available),
      price: Number(b.price || 0),
    }))
    .sort((a: any, b: any) => a.title.localeCompare(b.title));
}

export async function GET(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const settings = await prisma.setting.findFirst({ where: { id: 'settings' } });
    const currentSession = (settings?.currentSession as string) || '';

    // Determine viewer workspace + session ids (if any)
    const mySession = await prisma.mySession.findFirst({
      where: {
        userId: req.auth.user.id,
        session: currentSession,
        isActive: true,
      },
      include: {
        tableSaleSession: true,
        miniStoreSession: true,
        mainStoreSession: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.auth.user.id },
      select: { isAdmin: true, email: true },
    });

    const whereClause: any = { session: currentSession };

    // Non-admins: only see requests that involve them (as creator or destination session)
    if (!user?.isAdmin) {
      whereClause.OR = [
        { fromUserEmail: user?.email || undefined },
        mySession?.miniStoreSessionId
          ? { toMiniStoreSessionId: mySession.miniStoreSessionId }
          : undefined,
        mySession?.mainStoreSessionId
          ? { toMainStoreSessionId: mySession.mainStoreSessionId }
          : undefined,
      ].filter(Boolean);
    }

    const requests = await prisma.closingStockRequest.findMany({
      where: whereClause,
      include: {
        fromTableSaleSession: true,
        fromMiniStoreSession: true,
        toMiniStoreSession: true,
        toMainStoreSession: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  })(request, {});
}

export async function POST(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const settings = await prisma.setting.findFirst({ where: { id: 'settings' } });
    const currentSession = (settings?.currentSession as string) || '';

    const user = await prisma.user.findUnique({
      where: { id: req.auth.user.id },
      select: { isAdmin: true, email: true },
    });

    const body = await request.json().catch(() => ({}));
    const mode = String(body?.mode || 'auto'); // auto | table-to-mini | mini-to-main

    // Source session detection
    const mySession = await prisma.mySession.findFirst({
      where: {
        userId: req.auth.user.id,
        session: currentSession,
        isActive: true,
      },
      include: {
        tableSaleSession: true,
        miniStoreSession: true,
        mainStoreSession: true,
      },
    });

    // Block direct creation by main-store workspace; main-store verifies.
    if (!mySession) {
      return NextResponse.json({ message: 'Active session not found' }, { status: 404 });
    }

    // Table -> Mini
    const createTableToMini = async () => {
      if (!mySession.tableSaleSession) {
        return NextResponse.json({ message: 'Table sale session not found' }, { status: 404 });
      }

      const tableData = (mySession.tableSaleSession.data as any) || {};
      if (tableData.closingStock) {
        return NextResponse.json(
          { message: 'Stock has already been closed for this table session' },
          { status: 400 },
        );
      }

      // Find destination mini store session (same logic as existing requests)
      const tableId = mySession.tableSaleSession.tableId || '';
      const dataTableType = (mySession.tableSaleSession.data as any)?.tableType || '';
      const isPreorderTable =
        tableId.toLowerCase().includes('preorder') || dataTableType?.toLowerCase() === 'preorder';

      const destinationMiniStore = await prisma.miniStoreSession.findFirst({
        where: {
          session: currentSession,
          isActive: true,
          type: isPreorderTable ? 'preorder' : 'regular',
        },
      });

      if (!destinationMiniStore) {
        return NextResponse.json(
          { message: 'Destination mini store session not found' },
          { status: 404 },
        );
      }

      const tableStock = (mySession.tableSaleSession.data as any)?.list || [];
      const remainingStock = normalizeRemainingStock(tableStock);

      const newRequest = await prisma.closingStockRequest.create({
        data: {
          session: currentSession,
          fromWorkspace: 'table-manager',
          toWorkspace: 'mini-store',
          fromUserEmail: user?.email || null,
          fromTableSaleSessionId: mySession.tableSaleSession.id,
          toMiniStoreSessionId: destinationMiniStore.id,
          items: {
            requestedAt: new Date().toISOString(),
            totalItems: remainingStock.length,
            totalQuantity: remainingStock.reduce((sum: number, i: any) => sum + i.quantity, 0),
            list: remainingStock,
          },
        },
        include: {
          fromTableSaleSession: true,
          toMiniStoreSession: true,
        },
      });

      wsEmitter.emit(WebSocketEvents.REQUEST_CREATED, {
        requestId: newRequest.id,
        type: 'closing-stock',
        fromWorkspace: 'table-manager',
        toWorkspace: 'mini-store',
        toMiniStoreSessionId: destinationMiniStore.id,
        fromTableSaleSessionId: mySession.tableSaleSession.id,
      });

      return NextResponse.json({
        message: 'Closing stock request submitted for verification',
        request: newRequest,
      });
    };

    // Mini -> Main
    const createMiniToMain = async () => {
      if (!mySession.miniStoreSession) {
        return NextResponse.json({ message: 'Mini store session not found' }, { status: 404 });
      }

      if (mySession.miniStoreSession.closingStock) {
        return NextResponse.json(
          { message: 'Stock has already been closed for this mini store session' },
          { status: 400 },
        );
      }

      // Ensure all tables under this mini store are closed first (keep existing behavior)
      const approvedRequests = await prisma.miniStoreRequest.findMany({
        where: {
          miniStoreSessionId: mySession.miniStoreSession.id,
          wasApproved: true,
          tableSaleSessionId: { not: null },
        },
        include: {
          tableSaleSession: { select: { id: true, data: true, tableId: true, name: true } },
        },
      });

      const unclosedTables = approvedRequests
        .filter((r) => {
          const d = (r.tableSaleSession?.data as any) || {};
          return !d?.closingStock;
        })
        .map((r) => ({
          tableId: r.tableSaleSession?.tableId || 'Unknown',
          name: r.tableSaleSession?.name || 'Unknown',
        }));

      if (unclosedTables.length > 0) {
        return NextResponse.json(
          {
            message:
              'Cannot request closing. The following tables have not closed their sessions yet:',
            unclosedTables: unclosedTables.map((t) => `${t.name} (${t.tableId})`).join(', '),
            unclosedTableDetails: unclosedTables,
          },
          { status: 400 },
        );
      }

      const destinationMainStore = await prisma.mainStoreSession.findFirst({
        where: { session: currentSession, isActive: true },
      });
      if (!destinationMainStore) {
        return NextResponse.json(
          { message: 'Destination main store session not found' },
          { status: 404 },
        );
      }

      const miniStock = (mySession.miniStoreSession.data as any)?.list || [];
      const remainingStock = normalizeRemainingStock(miniStock);

      const newRequest = await prisma.closingStockRequest.create({
        data: {
          session: currentSession,
          fromWorkspace: mySession.workspace, // "mini-store" | "preorder-ministore"
          toWorkspace: 'main-store',
          fromUserEmail: user?.email || null,
          fromMiniStoreSessionId: mySession.miniStoreSession.id,
          toMainStoreSessionId: destinationMainStore.id,
          items: {
            requestedAt: new Date().toISOString(),
            totalItems: remainingStock.length,
            totalQuantity: remainingStock.reduce((sum: number, i: any) => sum + i.quantity, 0),
            list: remainingStock,
          },
        },
        include: {
          fromMiniStoreSession: true,
          toMainStoreSession: true,
        },
      });

      wsEmitter.emit(WebSocketEvents.REQUEST_CREATED, {
        requestId: newRequest.id,
        type: 'closing-stock',
        fromWorkspace: mySession.workspace,
        toWorkspace: 'main-store',
        toMainStoreSessionId: destinationMainStore.id,
        fromMiniStoreSessionId: mySession.miniStoreSession.id,
      });

      return NextResponse.json({
        message: 'Closing stock request submitted for verification',
        request: newRequest,
      });
    };

    // Admins can still create requests; verification is separate.
    if (mode === 'table-to-mini') return createTableToMini();
    if (mode === 'mini-to-main') return createMiniToMain();

    // auto: decide based on workspace
    if (mySession.workspace === 'table-manager') return createTableToMini();
    if (mySession.workspace === 'mini-store' || mySession.workspace === 'preorder-ministore')
      return createMiniToMain();

    return NextResponse.json(
      { message: 'This workspace cannot create closing stock requests' },
      { status: 400 },
    );
  })(request, {});
}

