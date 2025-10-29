'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WebSocketEvents } from '@/lib/websocket';

interface RequestManagementTableProps {
  requests?: any[]; // Make optional since we'll fetch client-side
  type: 'main-store' | 'mini-store';
}

export function RequestManagementTable({
  requests: initialRequests,
  type,
}: RequestManagementTableProps) {
  const queryClient = useQueryClient();

  // Fetch requests using React Query so we can invalidate on WebSocket events
  const { data: requests = initialRequests || [], isLoading } = useQuery({
    queryKey: [`${type}-requests`],
    queryFn: async () => {
      const response = await axios.get(`/api/requests/${type}`);
      return response.data;
    },
    initialData: initialRequests, // Use server-side data as initial data
    staleTime: 0, // Always consider stale to allow refetching
  });

  // Subscribe to real-time updates for requests
  useRealtimeUpdates({
    events: [
      WebSocketEvents.REQUEST_CREATED,
      WebSocketEvents.REQUEST_APPROVED,
      WebSocketEvents.REQUEST_DENIED,
      WebSocketEvents.STOCK_UPDATED,
    ],
    queryKeys: [`${type}-requests`], // Match the query key
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axios.patch(`/api/requests/${type}/${requestId}`, {
        requestId,
        approved: true,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Request approved');
      queryClient.invalidateQueries({ queryKey: [`${type}-requests`] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axios.patch(`/api/requests/${type}/${requestId}`, {
        requestId,
        approved: false,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Request denied');
      queryClient.invalidateQueries({ queryKey: [`${type}-requests`] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deny request');
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'request',
      header: 'Request Details',
      cell: ({ row }) => {
        const request = row.original.request as any;

        // Handle new format with multiple items
        if (request.items && Array.isArray(request.items)) {
          return (
            <div className='space-y-2'>
              <div className='text-sm text-gray-500'>
                Requested by: {request.requestedBy}
              </div>
              <div className='text-sm font-medium'>
                {request.totalItems} item{request.totalItems > 1 ? 's' : ''} •
                Total: {request.totalQuantity} units
              </div>
              <div className='space-y-1'>
                {request.items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className='text-sm border-l-2 border-gray-200 pl-2'
                  >
                    <span className='font-medium'>{item.bookTitle}</span>
                    <span className='text-gray-500 ml-2'>
                      × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Fallback for old format (single item)
        return (
          <div>
            <div className='font-medium'>{request.bookTitle}</div>
            <div className='text-sm text-gray-500'>
              Quantity: {request.quantity}
            </div>
            <div className='text-sm text-gray-500'>
              Requested by: {request.requestedBy}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Requested At',
      cell: ({ row }) => {
        return new Date(row.original.createdAt).toLocaleString();
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        if (row.original.wasApproved) {
          return (
            <Badge variant='default' className='bg-green-500'>
              Approved
            </Badge>
          );
        } else if (row.original.wasDenied) {
          return <Badge variant='destructive'>Denied</Badge>;
        } else {
          return <Badge variant='secondary'>Pending</Badge>;
        }
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.wasApproved || row.original.wasDenied) {
          return <span className='text-gray-500'>No actions</span>;
        }

        return (
          <div className='flex gap-2'>
            <Button
              size='sm'
              onClick={() => approveMutation.mutate(row.original.id)}
              disabled={approveMutation.isPending || denyMutation.isPending}
              className='bg-green-500 hover:bg-green-600'
            >
              Approve
            </Button>
            <Button
              size='sm'
              variant='destructive'
              onClick={() => denyMutation.mutate(row.original.id)}
              disabled={approveMutation.isPending || denyMutation.isPending}
            >
              Deny
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: requests || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return (
      <div className='rounded-md border p-8 text-center'>
        <div className='text-gray-500'>Loading requests...</div>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-24 text-center'>
                No requests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
