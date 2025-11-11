'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { IconBook, IconCurrencyDollar, IconPackage } from '@tabler/icons-react';

interface BooksSoldReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function BooksSoldReport({
  data,
  workspace,
  isAdmin,
}: BooksSoldReportProps) {
  if (!data) return <div>No data available</div>;

  const { booksSold, totalBooks, totalQuantity, totalValue } = data;

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'title',
      header: 'Book Title',
      cell: ({ row }) => (
        <div className='font-medium'>{row.original.title}</div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity Sold',
      cell: ({ row }) => <div>{row.original.quantity}</div>,
    },
    {
      accessorKey: 'price',
      header: 'Unit Price',
      cell: ({ row }) => (
        <div>₦{row.original.price.toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Total Value',
      cell: ({ row }) => (
        <div className='font-medium'>₦{row.original.value.toLocaleString()}</div>
      ),
    },
  ];

  const table = useReactTable({
    data: booksSold || [],
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
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Unique Books</CardTitle>
            <IconBook className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalBooks}</div>
            <p className='text-xs text-muted-foreground'>
              Different books sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Quantity
            </CardTitle>
            <IconPackage className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {totalQuantity.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>Total units sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Value</CardTitle>
            <IconCurrencyDollar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₦{totalValue.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>Total sales value</p>
          </CardContent>
        </Card>
      </div>

      {/* Books Sold Table */}
      <Card>
        <CardHeader>
          <CardTitle>Books Sold</CardTitle>
          <CardDescription>
            Detailed breakdown of books sold in current session
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                        const headerLabel =
                          typeof cell.column.columnDef.header === 'string'
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
                      className='text-center text-muted-foreground h-24'
                    >
                      No books sold yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          {booksSold && booksSold.length > 0 && (
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
                  booksSold.length
                )}{' '}
                of {booksSold.length} book{booksSold.length !== 1 ? 's' : ''}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
