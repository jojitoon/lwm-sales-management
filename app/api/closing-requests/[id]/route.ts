import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { wsEmitter, WebSocketEvents } from '@/lib/websocket';

function getRemainingList(itemsJson: any): Array<{ title: string; quantity: number; price: number }> {
  const list = itemsJson?.list;
  if (!Array.isArray(list)) return [];
  return list
    .map((i: any) => ({
      title: String(i.title),
      quantity: Number(i.quantity || 0),
      price: Number(i.price || 0),
    }))
    .filter((i: any) => i.title && i.quantity > 0);
}

async function returnStockToMiniStore(params: {
  tableSaleSessionId: string;
  miniStoreSessionId: string;
  remainingStock: Array<{ title: string; quantity: number; price: number }>;
  verifiedByEmail: string | null;
  verifiedByAdmin: boolean;
}) {
  const { tableSaleSessionId, miniStoreSessionId, remainingStock, verifiedByEmail, verifiedByAdmin } =
    params;

  const tableSaleSession = await prisma.tableSaleSession.findUnique({
    where: { id: tableSaleSessionId },
  });
  if (!tableSaleSession) {
    return { ok: false as const, status: 404, message: 'Table sale session not found' };
  }

  const currentData = (tableSaleSession.data as any) || {};
  if (currentData.closingStock) {
    return { ok: false as const, status: 400, message: 'Table stock already closed' };
  }

  const miniStoreSession = await prisma.miniStoreSession.findUnique({
    where: { id: miniStoreSessionId },
  });
  if (!miniStoreSession) {
    return { ok: false as const, status: 404, message: 'Mini store session not found' };
  }

  const miniStoreStock = (miniStoreSession.data as any)?.list || [];
  let updatedMiniStoreStock = [...miniStoreStock];

  if (remainingStock.length > 0) {
    updatedMiniStoreStock = miniStoreStock.map((book: any) => {
      const returnedItem = remainingStock.find((i) => i.title === book.title);
      if (!returnedItem) return book;
      return {
        ...book,
        available: Number(book.available || 0) + returnedItem.quantity,
        distributed: Math.max(0, Number(book.distributed || 0) - returnedItem.quantity),
      };
    });

    for (const item of remainingStock) {
      const exists = updatedMiniStoreStock.find((b: any) => b.title === item.title);
      if (!exists) {
        updatedMiniStoreStock.push({
          title: item.title,
          price: item.price,
          total: item.quantity,
          available: item.quantity,
          distributed: 0,
        });
      }
    }

    await prisma.miniStoreSession.update({
      where: { id: miniStoreSessionId },
      data: { data: { list: updatedMiniStoreStock } },
    });
  }

  const closingStockData = {
    closedAt: new Date().toISOString(),
    closedBy: verifiedByEmail,
    closedByAdmin: verifiedByAdmin,
    remainingStock,
    totalItems: remainingStock.length,
    totalQuantity: remainingStock.reduce((sum, i) => sum + i.quantity, 0),
  };

  await prisma.tableSaleSession.update({
    where: { id: tableSaleSessionId },
    data: {
      data: {
        ...currentData,
        closingStock: closingStockData,
      },
    },
  });

  wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
    sessionId: miniStoreSessionId,
    workspace: 'mini-store',
  });
  wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
    sessionId: tableSaleSessionId,
    workspace: 'table-manager',
  });

  return { ok: true as const, closingStock: closingStockData };
}

async function returnStockToMainStore(params: {
  miniStoreSessionId: string;
  mainStoreSessionId: string;
  remainingStock: Array<{ title: string; quantity: number; price: number }>;
  verifiedByEmail: string | null;
}) {
  const { miniStoreSessionId, mainStoreSessionId, remainingStock, verifiedByEmail } = params;

  const miniStoreSession = await prisma.miniStoreSession.findUnique({
    where: { id: miniStoreSessionId },
  });
  if (!miniStoreSession) {
    return { ok: false as const, status: 404, message: 'Mini store session not found' };
  }
  if (miniStoreSession.closingStock) {
    return { ok: false as const, status: 400, message: 'Mini store stock already closed' };
  }

  // Ensure all tables under this mini store are closed first (same as existing)
  const approvedRequests = await prisma.miniStoreRequest.findMany({
    where: {
      miniStoreSessionId,
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
    return {
      ok: false as const,
      status: 400,
      message: 'Cannot close stock. Some tables have not closed yet.',
      details: unclosedTables,
    };
  }

  const mainStoreSession = await prisma.mainStoreSession.findUnique({
    where: { id: mainStoreSessionId },
  });
  if (!mainStoreSession) {
    return { ok: false as const, status: 404, message: 'Main store session not found' };
  }

  const mainStoreStock = (mainStoreSession.data as any)?.list || [];

  if (remainingStock.length > 0) {
    let updatedMainStoreStock = mainStoreStock.map((book: any) => {
      const returnedItem = remainingStock.find((i) => i.title === book.title);
      if (!returnedItem) return book;
      return {
        ...book,
        available: Number(book.available || 0) + returnedItem.quantity,
        distributed: Math.max(0, Number(book.distributed || 0) - returnedItem.quantity),
      };
    });

    for (const item of remainingStock) {
      const exists = updatedMainStoreStock.find((b: any) => b.title === item.title);
      if (!exists) {
        updatedMainStoreStock.push({
          title: item.title,
          price: item.price,
          total: item.quantity,
          available: item.quantity,
          distributed: 0,
        });
      }
    }

    await prisma.mainStoreSession.update({
      where: { id: mainStoreSessionId },
      data: { data: { list: updatedMainStoreStock } },
    });
  }

  const closingStockData = {
    closedAt: new Date().toISOString(),
    closedBy: verifiedByEmail,
    remainingStock,
    totalItems: remainingStock.length,
    totalQuantity: remainingStock.reduce((sum, i) => sum + i.quantity, 0),
  };

  await prisma.miniStoreSession.update({
    where: { id: miniStoreSessionId },
    data: {
      closingStock: closingStockData,
      closedAt: new Date(),
    },
  });

  wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
    sessionId: miniStoreSessionId,
    workspace: 'mini-store',
  });
  wsEmitter.emit(WebSocketEvents.STOCK_UPDATED, {
    sessionId: mainStoreSessionId,
    workspace: 'main-store',
  });

  return { ok: true as const, closingStock: closingStockData };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return auth(async (req) => {
    if (!req.auth?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const closingRequest = await prisma.closingStockRequest.findUnique({
      where: { id },
      include: {
        fromTableSaleSession: true,
        fromMiniStoreSession: true,
        toMiniStoreSession: true,
        toMainStoreSession: true,
      },
    });
    if (!closingRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json(closingRequest);
  })(request, {});
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return auth(async (req) => {
    if (!req.auth?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.user.id },
      select: { isAdmin: true, email: true },
    });

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || 'verify'); // verify | deny
    const verification = body?.verification || null;

    const closingRequest = await prisma.closingStockRequest.findUnique({
      where: { id },
    });
    if (!closingRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
    if (closingRequest.status !== 'PENDING') {
      return NextResponse.json(
        { message: `Request already ${closingRequest.status.toLowerCase()}` },
        { status: 400 },
      );
    }

    // Authorization: must be admin OR be in destination workspace session
    const settings = await prisma.setting.findFirst({ where: { id: 'settings' } });
    const currentSession = (settings?.currentSession as string) || '';
    const mySession = await prisma.mySession.findFirst({
      where: {
        userId: req.auth.user.id,
        session: currentSession,
        isActive: true,
      },
    });

    const canVerify =
      user?.isAdmin ||
      (closingRequest.toMiniStoreSessionId &&
        mySession?.miniStoreSessionId === closingRequest.toMiniStoreSessionId) ||
      (closingRequest.toMainStoreSessionId &&
        mySession?.mainStoreSessionId === closingRequest.toMainStoreSessionId);

    if (!canVerify) {
      return NextResponse.json({ message: 'Not authorized to verify this request' }, { status: 403 });
    }

    if (action === 'deny') {
      const updated = await prisma.closingStockRequest.update({
        where: { id },
        data: {
          status: 'DENIED',
          verifiedBy: user?.email || null,
          verifiedAt: new Date(),
          verification: verification || undefined,
        },
      });
      wsEmitter.emit(WebSocketEvents.REQUEST_DENIED, {
        requestId: updated.id,
        type: 'closing-stock',
      });
      return NextResponse.json({ message: 'Closing stock request denied', request: updated });
    }

    // Verify: determine return operation
    const itemsJson = closingRequest.items as any;
    const remainingStock = getRemainingList(itemsJson);

    // Optional: allow verification to override quantities (if supplied)
    const verifiedList =
      Array.isArray(verification?.list) && verification.list.length > 0
        ? verification.list
            .map((i: any) => ({
              title: String(i.title),
              quantity: Number(i.quantity || 0),
              price: Number(i.price || 0),
            }))
            .filter((i: any) => i.title && i.quantity > 0)
        : remainingStock;

    let result:
      | { ok: true; closingStock: any }
      | { ok: false; status: number; message: string; details?: any };

    if (closingRequest.fromTableSaleSessionId && closingRequest.toMiniStoreSessionId) {
      result = await returnStockToMiniStore({
        tableSaleSessionId: closingRequest.fromTableSaleSessionId,
        miniStoreSessionId: closingRequest.toMiniStoreSessionId,
        remainingStock: verifiedList,
        verifiedByEmail: user?.email || null,
        verifiedByAdmin: !!user?.isAdmin,
      });
    } else if (closingRequest.fromMiniStoreSessionId && closingRequest.toMainStoreSessionId) {
      result = await returnStockToMainStore({
        miniStoreSessionId: closingRequest.fromMiniStoreSessionId,
        mainStoreSessionId: closingRequest.toMainStoreSessionId,
        remainingStock: verifiedList,
        verifiedByEmail: user?.email || null,
      });
    } else {
      return NextResponse.json({ message: 'Invalid request linkage' }, { status: 400 });
    }

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message, details: (result as any).details },
        { status: result.status },
      );
    }

    const updated = await prisma.closingStockRequest.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedBy: user?.email || null,
        verifiedAt: new Date(),
        verification: {
          ...(verification || {}),
          list: verifiedList,
        },
      },
    });

    wsEmitter.emit(WebSocketEvents.REQUEST_APPROVED, {
      requestId: updated.id,
      type: 'closing-stock',
    });

    return NextResponse.json({
      message: 'Closing stock verified and closed',
      request: updated,
      closingStock: result.closingStock,
    });
  })(request, {});
}

