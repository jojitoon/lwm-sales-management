import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminMainStoreStock } from '@/components/AdminMainStoreStock';
import { redirect } from 'next/navigation';

export default async function AdminMainStoresPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.isAdmin || false;

  if (!isAdmin) {
    redirect('/');
  }

  const settings = await prisma.setting.findFirst({
    where: { id: 'settings' },
  });

  // Get all main store sessions for the current session
  const mainStoreSessions = await prisma.mainStoreSession.findMany({
    where: {
      session: settings?.currentSession || '',
      isActive: true,
    },
    include: {
      mySessions: {
        where: {
          workspace: 'main-store',
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
      name: 'asc',
    },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Manage Main Stores Stock</h1>
      </div>

      <AdminMainStoreStock mainStoreSessions={mainStoreSessions} />
    </main>
  );
}

