import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleBasedReports } from '@/components/RoleBasedReports';

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className='px-4 lg:px-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-gray-500'>Please log in to view reports</div>
        </div>
      </main>
    );
  }

  const isAdmin = (session.user as any)?.isAdmin || false;
  const userId = session.user.id || '';

  // If userId is empty, show error message
  if (!userId) {
    return (
      <main className='px-4 lg:px-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-gray-500'>
            Unable to load reports - user ID not found
          </div>
        </div>
      </main>
    );
  }

  // Get current session settings
  const settings = await prisma.setting.findFirst({
    where: { id: 'settings' },
  });
  const currentSessionName = settings?.currentSession || '';

  // Get user's workspace from their active mySession
  let workspace = 'unknown';
  if (!isAdmin) {
    const mySession = await prisma.mySession.findFirst({
      where: {
        userId: userId,
        session: currentSessionName,
        isActive: true,
      },
    });

    workspace = mySession?.workspace || 'unknown';
  } else {
    // For admin, workspace can be determined from query params or default to 'unknown'
    // Admin can view all workspaces, so we'll use 'unknown' as default
    workspace = 'unknown';
  }

  // Customize description based on workspace
  const getDescription = () => {
    if (workspace === 'book-sales') {
      return `Current session sales report for ${currentSessionName}`;
    }
    return `Comprehensive reports and analytics for ${workspace.replace(
      '-',
      ' '
    )} workspace`;
  };

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-2xl font-bold'>Reports Dashboard</h1>
          <p className='text-gray-600 mt-1'>{getDescription()}</p>
        </div>
        <div className='text-sm text-gray-500'>
          {isAdmin ? 'Administrator Access' : 'User Access'}
        </div>
      </div>

      <RoleBasedReports
        workspace={workspace}
        isAdmin={isAdmin}
        userId={userId}
      />
    </main>
  );
}
