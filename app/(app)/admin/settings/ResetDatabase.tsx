'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AccountCard, AccountCardBody, AccountCardFooter } from './AccountCard';
import { resetDatabase } from '@/lib/actions/settings';

export default function ResetDatabase() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const confirmed = window.confirm(
      'This will permanently delete all sessions, sales, and related data, then reseed the admin account. Are you sure you want to continue?'
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await resetDatabase();
      if (result?.success) {
        toast.success('Database reset and reseeded');
      } else if (result?.error) {
        toast.error('Failed to reset database', {
          description: result.error,
        });
      } else {
        toast.error('Failed to reset database');
      }
    });
  };

  return (
    <AccountCard
      params={{
        header: 'Danger Zone',
        description:
          'Clear all sessions, sales, and related data, then reseed the admin account and base books from books.json.',
      }}
    >
      <AccountCardBody>
        <p className='text-sm text-muted-foreground'>
          This action will:
        </p>
        <ul className='mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1'>
          <li>Delete all sales and preorder data</li>
          <li>Delete all session data (table, mini store, main store, etc.)</li>
          <li>Delete all user accounts</li>
          <li>Recreate the default admin user and settings from the seed</li>
          <li>Reseed base books from the editable books.json file</li>
        </ul>
      </AccountCardBody>
      <AccountCardFooter description='This operation cannot be undone.'>
        <Button
          type='button'
          variant='destructive'
          disabled={isPending}
          onClick={handleClick}
        >
          {isPending ? 'Resetting…' : 'Reset database & reseed'}
        </Button>
      </AccountCardFooter>
    </AccountCard>
  );
}

