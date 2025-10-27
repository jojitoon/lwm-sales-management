import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const { bookTitle, quantity } = await request.json();

      if (!bookTitle || !quantity || quantity <= 0) {
        return NextResponse.json(
          { message: 'Invalid request data' },
          { status: 400 }
        );
      }

      const settings = await prisma.setting.findFirst({
        where: { id: 'settings' },
      });

      // Get current user's table sale session
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession as string,
          workspace: 'table-manager', // Changed from 'table-sale' to 'table-manager'
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

      // Get mini store session
      const miniStore = await prisma.miniStoreSession.findFirst({
        where: {
          session: settings?.currentSession as string,
          isActive: true,
        },
      });

      if (!miniStore) {
        return NextResponse.json(
          { message: 'Mini store session not found' },
          { status: 404 }
        );
      }

      // Create request
      const requestData = {
        bookTitle,
        quantity,
        requestedBy: req.auth.user.email,
        requestedAt: new Date().toISOString(),
      };

      const newRequest = await prisma.miniStoreRequest.create({
        data: {
          miniStoreSessionId: miniStore.id,
          tableSaleSessionId: mySession.tableSaleSession.id,
          request: requestData,
          granted: {},
        },
      });

      return NextResponse.json({
        message: 'Request sent successfully',
        request: newRequest,
      });
    } catch (error) {
      console.error('Error creating mini store request:', error);
      return NextResponse.json(
        { message: 'Failed to create request' },
        { status: 500 }
      );
    }
  })(request, {});
}
