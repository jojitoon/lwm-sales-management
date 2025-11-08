'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { IconLock, IconAlertTriangle } from '@tabler/icons-react';

interface SessionCloseDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  sessionType: 'main-store' | 'mini-store';
  session: {
    id: string;
    name?: string;
    session: string;
    managerId?: string;
    isActive: boolean;
    data?: any;
  };
}

export function SessionCloseDialog({
  open,
  setOpen,
  sessionType,
  session,
}: SessionCloseDialogProps) {
  const [confirmClose, setConfirmClose] = useState(false);
  const queryClient = useQueryClient();

  const closeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/sessions/close', {
        sessionType,
        sessionId: session.id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpen(false);
      setConfirmClose(false);
      // Reload the page to ensure fresh data
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to close session');
    },
  });

  const handleClose = () => {
    if (!confirmClose) {
      setConfirmClose(true);
      return;
    }
    closeMutation.mutate();
  };

  const currentStock = (session.data as any)?.list || [];
  const totalBooks = currentStock.length;
  const totalQuantity = currentStock.reduce(
    (sum: number, book: any) => sum + (book.available || 0),
    0
  );
  const totalValue = currentStock.reduce(
    (sum: number, book: any) => sum + (book.price || 0) * (book.available || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <IconLock className='h-5 w-5' />
            Close {sessionType === 'main-store'
              ? 'Main Store'
              : 'Mini Store'}{' '}
            Session
          </DialogTitle>
          <DialogDescription>
            This will capture the current stock levels and close the session for
            reporting purposes.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Session Info */}
          <div className='border rounded-lg p-4 bg-gray-50'>
            <h3 className='font-semibold mb-2'>Session Information</h3>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='font-medium'>Session Name:</span>{' '}
                {session.session}
              </div>
              {session.name && (
                <div>
                  <span className='font-medium'>Store Name:</span>{' '}
                  {session.name}
                </div>
              )}
              <div>
                <span className='font-medium'>Manager ID:</span>{' '}
                {session.managerId || 'N/A'}
              </div>
              <div>
                <span className='font-medium'>Status:</span>{' '}
                <Badge variant={session.isActive ? 'default' : 'secondary'}>
                  {session.isActive ? 'Active' : 'Closed'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Current Stock Summary */}
          <div className='border rounded-lg p-4 bg-blue-50'>
            <h3 className='font-semibold mb-2'>Current Stock Summary</h3>
            <div className='grid grid-cols-3 gap-4 text-sm'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {totalBooks}
                </div>
                <div className='text-gray-600'>Total Books</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {totalQuantity}
                </div>
                <div className='text-gray-600'>Total Quantity</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  ₦{totalValue.toLocaleString()}
                </div>
                <div className='text-gray-600'>Total Value</div>
              </div>
            </div>
          </div>

          {/* Stock Details */}
          {currentStock.length > 0 && (
            <div className='border rounded-lg p-4'>
              <h3 className='font-semibold mb-3'>Current Stock Details</h3>
              <div className='max-h-60 overflow-y-auto'>
                <div className='space-y-2'>
                  {currentStock.map((book: any, index: number) => (
                    <div
                      key={index}
                      className='flex justify-between items-center p-2 border rounded bg-white'
                    >
                      <div className='flex-1'>
                        <span className='font-medium'>{book.title}</span>
                      </div>
                      <div className='flex items-center gap-4 text-sm text-gray-600'>
                        <span>Available: {book.available}</span>
                        <span>Price: ₦{book.price?.toLocaleString()}</span>
                        <span className='font-medium'>
                          Value: ₦
                          {(
                            (book.price || 0) * (book.available || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {confirmClose && (
            <div className='border border-yellow-200 rounded-lg p-4 bg-yellow-50'>
              <div className='flex items-center gap-2 text-yellow-800'>
                <IconAlertTriangle className='h-5 w-5' />
                <span className='font-semibold'>Warning</span>
              </div>
              <p className='text-yellow-700 mt-2'>Closing this session will:</p>
              <ul className='list-disc list-inside text-yellow-700 mt-2 space-y-1'>
                <li>Capture the current stock levels as closing stock</li>
                <li>Mark the session as inactive</li>
                <li>Make the stock data available for reports</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleClose}
            disabled={closeMutation.isPending}
            className={confirmClose ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {closeMutation.isPending
              ? 'Closing...'
              : confirmClose
              ? 'Confirm Close Session'
              : 'Close Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
