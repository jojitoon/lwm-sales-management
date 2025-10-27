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

      // Get current user's mini store session
      const mySession = await prisma.mySession.findFirst({
        where: {
          userId: req.auth.user.id,
          session: settings?.currentSession as string,
          workspace: 'mini-store',
          isActive: true,
        },
        include: {
          miniStoreSession: true,
        },
      });

      if (!mySession?.miniStoreSession) {
        return NextResponse.json(
          { message: 'Mini store session not found' },
          { status: 404 }
        );
      }

      // Get main store session
      const mainStore = await prisma.mainStoreSession.findFirst({
        where: {
          session: settings?.currentSession as string,
          isActive: true,
        },
      });

      if (!mainStore) {
        return NextResponse.json(
          { message: 'Main store session not found' },
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

      const newRequest = await prisma.mainStoreRequest.create({
        data: {
          mainStoreSessionId: mainStore.id,
          miniStoreSessionId: mySession.miniStoreSession.id,
          request: requestData,
          granted: {},
        },
      });

      return NextResponse.json({
        message: 'Request sent successfully',
        request: newRequest,
      });
    } catch (error) {
      console.error('Error creating main store request:', error);
      return NextResponse.json(
        { message: 'Failed to create request' },
        { status: 500 }
      );
    }
  })(request, {});
}
