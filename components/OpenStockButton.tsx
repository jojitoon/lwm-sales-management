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
import { IconLockOpen } from '@tabler/icons-react';

interface OpenStockButtonProps {
  workspace: 'main-store' | 'mini-store' | 'table-manager';
  miniStoreSessionId?: string; // For admin to open stock for a specific mini store
  tableSaleSessionId?: string; // For admin to open stock for a specific table
  mainStoreSessionId?: string; // For admin to open stock for a specific main store
  onSuccess?: () => void; // Callback when stock is successfully opened
}

export function OpenStockButton({ 
  workspace,
  miniStoreSessionId,
  tableSaleSessionId,
  mainStoreSessionId,
  onSuccess,
}: OpenStockButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      let endpoint = '/api/stock/open/table-manager';
      let payload: any = {};
      
      if (workspace === 'mini-store') {
        endpoint = '/api/stock/open/mini-store';
        if (miniStoreSessionId) {
          payload.miniStoreSessionId = miniStoreSessionId;
        }
      } else if (workspace === 'main-store') {
        endpoint = '/api/stock/open/main-store';
        if (mainStoreSessionId) {
          payload.mainStoreSessionId = mainStoreSessionId;
        }
      } else if (workspace === 'table-manager') {
        if (tableSaleSessionId) {
          payload.tableSaleSessionId = tableSaleSessionId;
        }
      }

      const response = await axios.post(endpoint, Object.keys(payload).length > 0 ? payload : undefined);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Stock opened successfully');
      queryClient.invalidateQueries({ queryKey: ['main-store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['mini-store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['table-stock'] });
      setDialogOpen(false);
      router.refresh();
      // Call custom onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      let errorMessage = errorData?.message || 'Failed to open stock';
      toast.error(errorMessage);
    },
  });

  const handleOpenStock = () => {
    mutation.mutate();
  };

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setDialogOpen(true)}
        className='gap-2'
        disabled={mutation.isPending}
      >
        <IconLockOpen className='h-4 w-4' />
        Open Stock
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open Stock</AlertDialogTitle>
            <AlertDialogDescription>
              {workspace === 'main-store' && (
                <>
                  This will reopen the main store stock and restore distributed
                  books to the main store inventory.
                  <br />
                  <br />
                  <strong className='text-orange-600'>
                    This will restore the distributed quantities to the main store
                    books (available and total).
                  </strong>
                </>
              )}
              {workspace === 'mini-store' && (
                <>
                  This will reopen the mini store stock session.
                </>
              )}
              {workspace === 'table-manager' && (
                <>
                  This will reopen the table manager stock session.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOpenStock}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Opening...' : 'Open Stock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

