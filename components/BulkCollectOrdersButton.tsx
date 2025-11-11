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
import { IconCheck } from '@tabler/icons-react';

interface BulkCollectOrdersButtonProps {
  location: string;
  orderCount: number;
}

export function BulkCollectOrdersButton({
  location,
  orderCount,
}: BulkCollectOrdersButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (locationToCollect: string) => {
      const response = await axios.post('/api/orders/bulk-collect-by-location', {
        location: locationToCollect,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(
        data.message ||
          `Successfully marked ${data.ordersCollected} order(s) as collected`
      );
      queryClient.invalidateQueries({ queryKey: ['orders-location'] });
      setDialogOpen(false);
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to mark orders as collected'
      );
    },
  });

  const handleBulkCollect = () => {
    mutation.mutate(location);
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        disabled={mutation.isPending || orderCount === 0}
        className='gap-2 bg-green-600 hover:bg-green-700'
      >
        <IconCheck className='h-4 w-4' />
        Mark All as Collected ({orderCount})
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark All Orders as Collected</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark all <strong>{orderCount}</strong>{' '}
              uncollected order(s) for location{' '}
              <strong>{location.replace(/_/g, ' ')}</strong> as collected?
              <br />
              <br />
              This will:
              <ul className='list-disc list-inside mt-2 space-y-1'>
                <li>Mark all matching orders as collected</li>
                <li>Mark all order items as collected</li>
                <li>Create a consolidation record</li>
              </ul>
              <br />
              <strong className='text-red-600'>
                This action cannot be undone.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkCollect}
              disabled={mutation.isPending}
              className='bg-green-600 hover:bg-green-700'
            >
              {mutation.isPending ? 'Marking...' : 'Mark All as Collected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

