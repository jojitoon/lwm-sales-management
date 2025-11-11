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
      let endpoint = '/api/stock/close/table-manager';
      let payload: any = {};

      if (workspace === 'mini-store' || workspace === 'preorder-ministore') {
        endpoint = '/api/stock/close/mini-store';
        if (miniStoreSessionId) {
          payload.miniStoreSessionId = miniStoreSessionId;
        }
      } else if (workspace === 'main-store') {
        endpoint = '/api/stock/close/main-store';
        if (mainStoreSessionId) {
          payload.mainStoreSessionId = mainStoreSessionId;
        }
      } else if (workspace === 'table-manager') {
        if (tableSaleSessionId) {
          payload.tableSaleSessionId = tableSaleSessionId;
        }
      }

      const response = await axios.post(
        endpoint,
        Object.keys(payload).length > 0 ? payload : undefined
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Stock closed successfully');
      queryClient.invalidateQueries({ queryKey: ['table-stock'] });
      queryClient.invalidateQueries({ queryKey: ['mini-store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['main-store-stock'] });
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
            This will{' '}
            {workspace === 'main-store'
              ? 'close the main store session and record all distributed stock for this session'
              : `return all remaining stock back to ${
                  workspace === 'table-manager'
                    ? 'the mini store'
                    : 'the main store'
                }`}
            . This action cannot be undone. Are you sure you want to continue?
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
