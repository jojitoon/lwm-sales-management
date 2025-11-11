import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminMiniStoreStock } from '@/components/AdminMiniStoreStock';
import { redirect } from 'next/navigation';

export default async function AdminMiniStoresPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.isAdmin || false;

  if (!isAdmin) {
    redirect('/');
  }

  const settings = await prisma.setting.findFirst({
    where: { id: 'settings' },
  });

  // Get all mini store sessions for the current session
  const miniStoreSessions = await prisma.miniStoreSession.findMany({
    where: {
      session: settings?.currentSession || '',
      isActive: true,
    },
    include: {
      mySessions: {
        where: {
          workspace: { in: ['mini-store', 'preorder-ministore'] },
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Manage Mini Stores Stock</h1>
      </div>

      <AdminMiniStoreStock miniStoreSessions={miniStoreSessions} />
    </main>
  );
}

