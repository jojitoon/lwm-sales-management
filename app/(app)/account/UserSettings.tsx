'use client';
import UpdateNameCard from './UpdateNameCard';
import UpdateEmailCard from './UpdateEmailCard';
import { Session } from 'next-auth';
export default function UserSettings({ session }: { session: Session }) {
  return (
    <>
      <UpdateNameCard name={session?.user?.name ?? ''} />
      <UpdateEmailCard email={session?.user?.email ?? ''} />
    </>
  );
}
