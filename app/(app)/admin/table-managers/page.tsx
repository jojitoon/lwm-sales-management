import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminTableManagerStock } from '@/components/AdminTableManagerStock';
import { redirect } from 'next/navigation';

export default async function AdminTableManagersPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.isAdmin || false;

  if (!isAdmin) {
    redirect('/');
  }

  const settings = await prisma.setting.findFirst({
    where: { id: 'settings' },
  });

  // Get all table sale sessions for the current session
  const tableSaleSessions = await prisma.tableSaleSession.findMany({
    where: {
      session: settings?.currentSession || '',
      isActive: true,
    },
    include: {
      mySessions: {
        where: {
          workspace: { in: ['table-manager', 'pre-order'] },
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
      tableId: 'asc',
    },
  });

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>Manage Table Managers Stock</h1>
      </div>

      <AdminTableManagerStock tableSaleSessions={tableSaleSessions} />
    </main>
  );
}

