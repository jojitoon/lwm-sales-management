import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleBasedDashboard } from '@/components/RoleBasedDashboard';

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
        <div className='px-4 lg:px-6'>
          <div className='flex justify-center items-center h-64'>
            <div className='text-gray-500'>Please log in to view dashboard</div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = (session.user as any)?.isAdmin || false;
  const userId = session.user.id || '';

  // Get current session settings
  const settings = await prisma.setting.findFirst({
    where: { id: 'settings' },
  });
  const currentSessionName = settings?.currentSession || '';

  // Get user's workspace from their active mySession
  let workspace = 'unknown';
  if (!isAdmin && userId) {
    const mySession = await prisma.mySession.findFirst({
      where: {
        userId: userId,
        session: currentSessionName,
        isActive: true,
      },
    });

    workspace = mySession?.workspace || 'unknown';
  }

  return (
    <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
      <div className='px-4 lg:px-6'>
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl font-bold'>Dashboard</h1>
        </div>
      </div>
      <RoleBasedDashboard workspace={workspace} />
    </div>
  );
}
