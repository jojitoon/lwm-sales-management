'use client';

import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PackageX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CloseStockButtonProps {
  workspace:
    | 'table-manager'
    | 'mini-store'
    | 'main-store'
    | 'preorder-ministore';
  tableSaleSessionId?: string; // For admin to close stock for a specific table
  miniStoreSessionId?: string; // For admin to close stock for a specific mini store
  mainStoreSessionId?: string; // For admin to close stock for a specific main store
  onSuccess?: () => void; // Callback when stock is successfully closed
}

export function CloseStockButton({
  workspace,
  tableSaleSessionId,
  miniStoreSessionId,
  mainStoreSessionId,
  onSuccess,
}: CloseStockButtonProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      // Table managers and mini stores now submit a closing request
      // which must be verified by the destination store before stock is returned/closed.
      if (workspace === 'table-manager' || workspace === 'mini-store' || workspace === 'preorder-ministore') {
        const response = await axios.post('/api/closing-requests', {
          mode: workspace === 'table-manager' ? 'table-to-mini' : 'mini-to-main',
        });
        return response.data;
      }

      // Main store can still close directly (end-of-chain).
      let endpoint = '/api/stock/close/main-store';
      const payload: any = {};

      if (mainStoreSessionId) {
        payload.mainStoreSessionId = mainStoreSessionId;
      }

      const response = await axios.post(
        endpoint,
        Object.keys(payload).length > 0 ? payload : undefined
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Success');
      queryClient.invalidateQueries({ queryKey: ['table-stock'] });
      queryClient.invalidateQueries({ queryKey: ['mini-store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['main-store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['closing-requests'] });
      router.refresh();
      // Call custom onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      let errorMessage = errorData?.message || 'Failed to close stock';

      // If there are unclosed tables or mini stores, include them in the error message
      if (errorData?.unclosedTables) {
        errorMessage += `\n${errorData.unclosedTables}`;
      }
      if (errorData?.unclosedMiniStores) {
        errorMessage += `\n${errorData.unclosedMiniStores}`;
      }

      toast.error(errorMessage, {
        duration: 6000, // Show longer for detailed messages
      });
    },
  });

  const handleCloseStock = () => {
    mutation.mutate();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='outline'
          disabled={mutation.isPending}
          className='gap-2'
        >
          <PackageX className='h-4 w-4' />
          Close Stock
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Stock</AlertDialogTitle>
          <AlertDialogDescription>
            {workspace === 'main-store'
              ? 'This will close the main store session and record all distributed stock for this session.'
              : 'This will submit a closing stock request for verification. The destination store must verify the returned quantities before the stock is actually closed and returned.'}{' '}
            Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCloseStock}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Closing...' : 'Close Stock'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
