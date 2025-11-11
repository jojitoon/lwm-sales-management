'use client';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Order ID',
    cell: ({ row }) => (
      <div className='capitalize'>{row.original.orderNumber}</div>
    ),
  },
  {
    accessorKey: 'email',
    cell: ({ row }) => {
      return <div>{row.original.email}</div>;
    },
    header: 'Email',
  },
  {
    accessorKey: 'Book',
    cell: ({ row }) => {
      return (
        <div>
          {row.original.items
            ?.map((i: any) => `${i.productName} (${i.quantity})`)
            .join(', ')}
        </div>
      );
    },
    header: 'Book',
  },
  {
    accessorKey: 'Price',
    header: () => <div className='text-right'>Total</div>,
    cell: ({ row }) => {
      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'NGN',
      }).format(row.original.total);

      return <div className='text-right font-medium'>{formatted}</div>;
    },
  },
];

export const OrdersReportTable = ({ data }: { data: any[] }) => {
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div>
      {' '}
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
                  {row.getVisibleCells().map((cell) => {
                    const headerLabel = typeof cell.column.columnDef.header === 'string' 
                      ? cell.column.columnDef.header 
                      : cell.column.id;
                    return (
                      <TableCell key={cell.id} data-label={headerLabel}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
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
      <div className='flex items-center justify-between space-x-2 py-4 px-4'>
        <div className='text-sm text-muted-foreground'>
          Showing{' '}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{' '}
          to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            data.length
          )}{' '}
          of {data.length} order{data.length !== 1 ? 's' : ''}
        </div>
        <div className='flex items-center space-x-2'>
          <div className='text-sm text-muted-foreground'>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount() || 1}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
