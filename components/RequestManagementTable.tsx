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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

interface RequestManagementTableProps {
  requests: any[];
  type: 'main-store' | 'mini-store';
}

export function RequestManagementTable({
  requests,
  type,
}: RequestManagementTableProps) {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['requests'] });
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
      queryClient.invalidateQueries({ queryKey: ['requests'] });
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
