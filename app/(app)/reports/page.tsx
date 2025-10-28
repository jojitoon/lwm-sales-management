import { auth } from '@/lib/auth';
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

  // Get user's workspace from session
  const workspace = (session.user as any)?.workspace || 'unknown';

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

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-2xl font-bold'>Reports Dashboard</h1>
          <p className='text-gray-600 mt-1'>
            Comprehensive reports and analytics for{' '}
            {workspace.replace('-', ' ')} workspace
          </p>
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
