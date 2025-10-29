'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { IconBell, IconClock } from '@tabler/icons-react';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WebSocketEvents } from '@/lib/websocket';
import { useSession } from 'next-auth/react';

interface PendingRequestsButtonProps {
  type: 'main-store' | 'mini-store';
  workspace?: string;
}

interface RequestItem {
  bookTitle: string;
  quantity: number;
}

interface Request {
  id: string;
  request: {
    items?: RequestItem[];
    bookTitle?: string;
    quantity?: number;
    requestedBy: string;
    requestedAt: string;
    totalItems?: number;
    totalQuantity?: number;
  };
  createdAt: string;
  wasApproved: boolean;
  wasDenied: boolean;
}

export function PendingRequestsButton({
  type,
  workspace,
}: PendingRequestsButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email;

  // Subscribe to real-time updates for requests
  useRealtimeUpdates({
    events: [
      WebSocketEvents.REQUEST_CREATED,
      WebSocketEvents.REQUEST_APPROVED,
      WebSocketEvents.REQUEST_DENIED,
    ],
    queryKeys: [`${type}-requests`],
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: [`${type}-requests`],
    queryFn: async () => {
      const response = await axios.get(`/api/requests/${type}`);
      return response.data;
    },
    refetchInterval: false, // Disable polling, rely on WebSocket updates
  });

  // Filter for pending requests
  // Only show requests WHERE the current user is the requestor
  // For mini-store requests: Show to table-manager users (they requested from mini-store)
  // For main-store requests: Show to mini-store users (they requested from main-store)
  const pendingRequests = requests.filter((request: Request) => {
    // Only show pending requests
    if (request.wasApproved || request.wasDenied) return false;

    // Only show requests made by the current user (requestor)
    if (request.request.requestedBy !== currentUserEmail) return false;

    return true;
  });

  const pendingCount = pendingRequests.length;

  // Don't show button if no pending requests or if user email is not available
  if (pendingCount === 0 || !currentUserEmail) {
    return null;
  }

  // Only show button to requestors based on workspace
  // type='mini-store' requests are made by table-manager users
  // type='main-store' requests are made by mini-store users
  const isRequestor =
    (type === 'mini-store' &&
      (workspace === 'table-manager' || workspace === 'book-sales')) ||
    (type === 'main-store' && workspace === 'mini-store');

  if (!isRequestor) {
    return null;
  }

  return (
    <>
      <Button
        variant='outline'
        onClick={() => setOpen(true)}
        className='relative gap-2'
      >
        <IconBell className='h-4 w-4' />
        Pending Requests
        <Badge variant='destructive' className='ml-1'>
          {pendingCount}
        </Badge>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <IconClock className='h-5 w-5' />
              Pending {type === 'main-store' ? 'Main Store' : 'Mini Store'}{' '}
              Requests
            </DialogTitle>
            <DialogDescription>
              {pendingCount} request{pendingCount > 1 ? 's' : ''} pending
              approval
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {pendingRequests.map((request: Request) => (
              <div key={request.id} className='border rounded-lg p-4 bg-card'>
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <div className='text-sm text-gray-500'>
                      Requested by: {request.request.requestedBy}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Badge
                    variant='secondary'
                    className='bg-yellow-100 text-yellow-800'
                  >
                    Pending
                  </Badge>
                </div>

                <div className='space-y-2'>
                  {/* Handle new format with multiple items */}
                  {request.request.items &&
                  Array.isArray(request.request.items) ? (
                    <>
                      <div className='text-sm font-medium'>
                        {request.request.totalItems} item
                        {request.request.totalItems! > 1 ? 's' : ''} • Total:{' '}
                        {request.request.totalQuantity} units
                      </div>
                      <div className='space-y-1'>
                        {request.request.items.map(
                          (item: RequestItem, index: number) => (
                            <div
                              key={index}
                              className='text-sm border-l-2 border-gray-300 pl-2'
                            >
                              <span className='font-medium'>
                                {item.bookTitle}
                              </span>
                              <span className='text-gray-500 ml-2'>
                                × {item.quantity}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  ) : (
                    /* Fallback for old format (single item) */
                    <div>
                      <div className='font-medium'>
                        {request.request.bookTitle}
                      </div>
                      <div className='text-sm text-gray-500'>
                        Quantity: {request.request.quantity}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className='flex justify-end gap-2 pt-4 border-t'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
