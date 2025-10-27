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

      const mainStore = await prisma.mainStoreSession.findFirst({
        where: {
          session: settings?.currentSession as string,
          isActive: true,
        },
      });

      const stock = (mainStore?.data as any)?.list || [];

      return NextResponse.json(stock);
    } catch (error) {
      console.error('Error fetching main store stock:', error);
      return NextResponse.json(
        { message: 'Failed to fetch main store stock' },
        { status: 500 }
      );
    }
  })(request, {});
}
