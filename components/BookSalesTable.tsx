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
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WebSocketEvents } from '@/lib/websocket';

interface BookSalesTableProps {
  sales?: any[];
}

export function BookSalesTable({ sales: initialSales }: BookSalesTableProps) {
  // Fetch book sales client-side for real-time updates
  const { data: fetchedSales = [], isLoading } = useQuery({
    queryKey: ['book-sales'],
    queryFn: async () => {
      const response = await axios.get('/api/book-sales');
      return response.data;
    },
    initialData: initialSales,
    staleTime: 0, // Always consider stale to allow refetching
  });

  // Subscribe to real-time updates for book sales
  useRealtimeUpdates({
    events: [WebSocketEvents.BOOK_SALE_CREATED],
    queryKeys: ['book-sales'],
  });

  // Use fetched data (React Query will use initialData as fallback)
  const sales = fetchedSales || [];
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order Number',
      cell: ({ row }) => (
        <div className='font-medium'>{row.original.orderNumber}</div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className='font-medium'>{row.original.fullName}</div>
          <div className='text-sm text-gray-500'>{row.original.email}</div>
          {row.original.phoneNumber && (
            <div className='text-sm text-gray-500'>
              {row.original.phoneNumber}
            </div>
          )}
          {row.original.customerLocation && (
            <div className='text-sm text-gray-500'>
              Location: {row.original.customerLocation}
            </div>
          )}
          {row.original.slipNumber && (
            <div className='text-sm text-gray-500'>
              Slip: {row.original.slipNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => (
        <div className='space-y-1'>
          {row.original.items.map((item: any, index: number) => (
            <div key={index} className='text-sm'>
              <span className='font-medium'>{item.book.title}</span>
              <span className='text-gray-500 ml-2'>
                (Qty: {item.quantity} × ₦{item.price.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <div className='font-semibold'>
          ₦{Number(row.original.total).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className='text-sm'>
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.original.isPaid
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {row.original.isPaid ? 'Paid' : 'Unpaid'}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.original.orderStatus === 'COMPLETED'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {row.original.orderStatus}
          </span>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: sales || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading && !initialSales) {
    return (
      <div className='rounded-md border p-8 text-center'>
        <div className='text-gray-500'>Loading sales...</div>
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
                No sales found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
