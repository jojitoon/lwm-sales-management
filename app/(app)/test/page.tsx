import { auth } from '@/lib/auth';
import { TestControlCenter } from '@/components/TestControlCenter';

export default async function Page() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.isAdmin || false;

  if (!session?.user || !isAdmin) {
    return (
      <div className='flex flex-col gap-4 py-6'>
        <div className='px-4 lg:px-6'>
          <div className='rounded-md border p-4 text-sm text-muted-foreground'>
            You must be logged in as admin to access the test control center.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
      <div className='px-4 lg:px-6'>
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl font-bold'>Test Control Center</h1>
        </div>
        <TestControlCenter />
      </div>
    </div>
  );
}

