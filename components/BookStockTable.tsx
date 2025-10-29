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

interface BookStockTableProps {
  data?: {
    title: string;
    price: number;
    total: number;
    available: number;
    distributed: number;
  }[];
  stockType?: 'main-store-stock' | 'mini-store-stock' | 'table-stock';
}

export const BookStockTable = ({
  data: initialData,
  stockType,
}: BookStockTableProps) => {
  // If stockType is provided, fetch data client-side for real-time updates
  const { data: fetchedData = [], isLoading } = useQuery({
    queryKey: stockType ? [stockType] : [],
    queryFn: async () => {
      if (stockType === 'main-store-stock') {
        const response = await axios.get('/api/books/main-store-stock');
        return response.data;
      } else if (stockType === 'mini-store-stock') {
        const response = await axios.get('/api/books/mini-store-stock');
        return response.data;
      } else if (stockType === 'table-stock') {
        // Fetch table sale session stock
        const response = await axios.get('/api/books/table-stock');
        return response.data;
      }
      return [];
    },
    enabled: !!stockType,
    initialData: initialData,
    staleTime: 0, // Always consider stale to allow refetching
  });

  // Subscribe to real-time stock updates
  useRealtimeUpdates({
    events: [WebSocketEvents.STOCK_UPDATED, WebSocketEvents.BOOK_SALE_CREATED],
    queryKeys: stockType ? [stockType] : [],
    onEvent: (event, data) => {
      // Additional logic can be added here if needed
      console.log('Stock update received:', event, data);
    },
  });

  // Use fetched data if available, otherwise use initial data
  const data = stockType ? fetchedData : initialData || [];

  const columns: ColumnDef<{
    title: string;
    price: number;
    total: number;
    available: number;
    distributed: number;
  }>[] = [
    {
      accessorKey: 'title',
      cell: ({ row }) => {
        return <div className='capitalize'>{row.original.title}</div>;
      },
      header: 'Title',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <div>{`${Number(row.original.price).toLocaleString('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`}</div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <div>{Number(row.original.total).toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'available',
      header: 'Available',
      cell: ({ row }) => (
        <div>{Number(row.original.available).toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'distributed',
      header: 'Distributed',
      cell: ({ row }) => (
        <div>{Number(row.original.distributed).toLocaleString()}</div>
      ),
    },
  ];

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading && stockType) {
    return (
      <div className='rounded-md border p-8 text-center'>
        <div className='text-gray-500'>Loading stock...</div>
      </div>
    );
  }

  return (
    <main className=''>
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
};
