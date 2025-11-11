'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { IconRefresh } from '@tabler/icons-react';

interface ReconcileConsolidationsButtonProps {
  session: string;
}

export function ReconcileConsolidationsButton({
  session,
}: ReconcileConsolidationsButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (sessionToReconcile: string) => {
      const response = await axios.post(
        `/api/consolidations/${encodeURIComponent(sessionToReconcile)}/reconcile`
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(
        data.message ||
          'Consolidations reconciled successfully with book stocks'
      );
      queryClient.invalidateQueries({ queryKey: ['books-report'] });
      setDialogOpen(false);
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Failed to reconcile consolidations'
      );
    },
  });

  const handleReconcile = () => {
    if (session === 'All') {
      toast.error('Cannot reconcile consolidations for "All" sessions');
      return;
    }
    mutation.mutate(session);
  };

  return (
    <>
      <Button
        variant='default'
        size='sm'
        onClick={() => setDialogOpen(true)}
        className='gap-2'
        disabled={mutation.isPending}
      >
        <IconRefresh className='h-4 w-4' />
        Reconcile with Book Stocks
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reconcile Consolidations</AlertDialogTitle>
            <AlertDialogDescription>
              This will reconcile all consolidations for session{' '}
              <strong>{session.replace(/_/g, ' ')}</strong> with book stocks.
              <br />
              <br />
              This will:
              <ul className='list-disc list-inside mt-2 space-y-1'>
                <li>Deduct stock from table managers' stock based on consolidated items</li>
                <li>Update global book quantities (preorderAvailable and available)</li>
                <li>Handle combo books and their component books</li>
                <li>Use book mappings to match products to books</li>
              </ul>
              <br />
              <strong className='text-orange-600'>
                This action can only be performed for consolidations without stock movement.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReconcile}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Reconciling...' : 'Reconcile'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

