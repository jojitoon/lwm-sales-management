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
  workspace: 'table-manager' | 'mini-store' | 'main-store';
}

export function CloseStockButton({ workspace }: CloseStockButtonProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      let endpoint = '/api/stock/close/table-manager';
      if (workspace === 'mini-store') {
        endpoint = '/api/stock/close/mini-store';
      } else if (workspace === 'main-store') {
        endpoint = '/api/stock/close/main-store';
      }
      const response = await axios.post(endpoint);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Stock closed successfully');
      queryClient.invalidateQueries({ queryKey: ['table-stock'] });
      queryClient.invalidateQueries({ queryKey: ['mini-store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['main-store-stock'] });
      router.refresh();
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

