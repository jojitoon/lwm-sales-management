// import SignOutBtn from '@/components/auth/SignOutBtn';
import UserSettings from './UserSettings';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Account() {
  const session = await auth();
  if (!session) {
    redirect('/sign-in');
  }

  return (
    <main className='px-4 lg:px-6'>
      <h1 className='text-2xl font-semibold my-4'>Account</h1>
      <div className='space-y-4'>
        <UserSettings session={session} />
        {/* <SignOutBtn /> */}
      </div>
    </main>
  );
}
