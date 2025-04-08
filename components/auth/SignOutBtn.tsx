'use client';

import { Button } from '../ui/button';
import { signOut } from 'next-auth/react';

export default function SignOutBtn() {
  return <Btn />;
}

const Btn = () => {
  return (
    <Button variant={'destructive'} onClick={() => signOut()}>
      Sign out
    </Button>
  );
};
