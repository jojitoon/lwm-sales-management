'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  IconTrendingUp,
  IconPackage,
  IconUsers,
  IconCurrencyDollar,
} from '@tabler/icons-react';

interface SalesSummaryReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function SalesSummaryReport({
  data,
  workspace,
  isAdmin,
}: SalesSummaryReportProps) {
  if (!data) return <div>No data available</div>;

  const {
    totalSales,
    totalItems,
    uniqueBooks,
    totalTransactions,
    salesByUser,
    recentSales,
  } = data;

  // Columns for Sales by User table
  const salesByUserColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'email',
      header: 'User',
      cell: ({ row }) => (
        <div className='font-medium'>{row.original.email}</div>
      ),
    },
    {
      accessorKey: 'totalSales',
      header: 'Total Sales',
      cell: ({ row }) => (
        <div>₦{row.original.totalSales.toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'totalItems',
      header: 'Items Sold',
      cell: ({ row }) => <div>{row.original.totalItems}</div>,
    },
    {
      accessorKey: 'uniqueBooks',
      header: 'Unique Books',
      cell: ({ row }) => (
        <Badge variant='outline'>{row.original.uniqueBooks}</Badge>
      ),
    },
  ];

  // Columns for Recent Sales table
  const recentSalesColumns: ColumnDef<any>[] =
    workspace === 'book-sales'
      ? [
          {
            accessorKey: 'slipNumber',
            header: 'Slip Number',
            cell: ({ row }) => (
              <div className='font-medium'>{row.original.slipNumber || '-'}</div>
            ),
          },
          {
            accessorKey: 'orderNumber',
            header: 'Order Number',
            cell: ({ row }) => (
              <div className='text-sm text-gray-600'>
                {row.original.orderNumber}
              </div>
            ),
          },
          {
            accessorKey: 'soldBy',
            header: 'Customer',
            cell: ({ row }) => <div>{row.original.soldBy}</div>,
          },
          {
            accessorKey: 'items',
            header: 'Books',
            cell: ({ row }) => (
              <div>
                {row.original.items ? (
                  row.original.items.map((item: any, idx: number) => (
                    <div key={idx} className='text-sm'>
                      {item.title} (x{item.quantity})
                    </div>
                  ))
                ) : (
                  <div className='text-sm'>{row.original.productName}</div>
                )}
              </div>
            ),
          },
          {
            accessorKey: 'total',
            header: 'Total',
            cell: ({ row }) => (
              <div className='font-medium'>
                ₦{row.original.total.toLocaleString()}
              </div>
            ),
          },
          {
            accessorKey: 'soldAt',
            header: 'Date',
            cell: ({ row }) => (
              <div>{new Date(row.original.soldAt).toLocaleDateString()}</div>
            ),
          },
        ]
      : [
          {
            accessorKey: 'productName',
            header: 'Book',
            cell: ({ row }) => (
              <div className='font-medium'>{row.original.productName}</div>
            ),
          },
          {
            accessorKey: 'quantity',
            header: 'Quantity',
            cell: ({ row }) => <div>{row.original.quantity}</div>,
          },
          {
            accessorKey: 'price',
            header: 'Price',
            cell: ({ row }) => (
              <div>₦{row.original.price?.toLocaleString()}</div>
            ),
          },
          {
            accessorKey: 'total',
            header: 'Total',
            cell: ({ row }) => (
              <div className='font-medium'>
                ₦{row.original.total.toLocaleString()}
              </div>
            ),
          },
          {
            accessorKey: 'soldBy',
            header: 'Sold By',
            cell: ({ row }) => <div>{row.original.soldBy}</div>,
          },
          {
            accessorKey: 'soldAt',
            header: 'Date',
            cell: ({ row }) => (
              <div>{new Date(row.original.soldAt).toLocaleDateString()}</div>
            ),
          },
        ];

  const salesByUserTable = useReactTable({
    data: salesByUser || [],
    columns: salesByUserColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const recentSalesTable = useReactTable({
    data: recentSales || [],
    columns: recentSalesColumns,
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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Sales</CardTitle>
            <IconCurrencyDollar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₦{totalSales.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Total revenue generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Items Sold</CardTitle>
            <IconPackage className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {totalItems.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>Total units sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Unique Books</CardTitle>
            <IconTrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{uniqueBooks}</div>
            <p className='text-xs text-muted-foreground'>
              Different books sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Transactions</CardTitle>
            <IconUsers className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalTransactions}</div>
            <p className='text-xs text-muted-foreground'>Total transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales by User (Admin only) */}
      {isAdmin && salesByUser && salesByUser.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by User</CardTitle>
            <CardDescription>Performance breakdown by user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  {salesByUserTable.getHeaderGroups().map((headerGroup) => (
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
                  {salesByUserTable.getRowModel().rows?.length ? (
                    salesByUserTable.getRowModel().rows.map((row) => (
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
                        colSpan={salesByUserColumns.length}
                        className='text-center text-muted-foreground h-24'
                      >
                        No sales data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination Controls */}
            {salesByUser && salesByUser.length > 0 && (
              <div className='flex items-center justify-between space-x-2 py-4 px-4'>
                <div className='text-sm text-muted-foreground'>
                  Showing{' '}
                  {salesByUserTable.getState().pagination.pageIndex *
                    salesByUserTable.getState().pagination.pageSize +
                    1}{' '}
                  to{' '}
                  {Math.min(
                    (salesByUserTable.getState().pagination.pageIndex + 1) *
                      salesByUserTable.getState().pagination.pageSize,
                    salesByUser.length
                  )}{' '}
                  of {salesByUser.length} user{salesByUser.length !== 1 ? 's' : ''}
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='text-sm text-muted-foreground'>
                    Page {salesByUserTable.getState().pagination.pageIndex + 1} of{' '}
                    {salesByUserTable.getPageCount() || 1}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => salesByUserTable.previousPage()}
                    disabled={!salesByUserTable.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => salesByUserTable.nextPage()}
                    disabled={!salesByUserTable.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {recentSalesTable.getHeaderGroups().map((headerGroup) => (
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
                {recentSalesTable.getRowModel().rows?.length ? (
                  recentSalesTable.getRowModel().rows.map((row) => (
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
                      colSpan={recentSalesColumns.length}
                      className='text-center text-muted-foreground h-24'
                    >
                      No recent sales
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          {recentSales && recentSales.length > 0 && (
            <div className='flex items-center justify-between space-x-2 py-4 px-4'>
              <div className='text-sm text-muted-foreground'>
                Showing{' '}
                {recentSalesTable.getState().pagination.pageIndex *
                  recentSalesTable.getState().pagination.pageSize +
                  1}{' '}
                to{' '}
                {Math.min(
                  (recentSalesTable.getState().pagination.pageIndex + 1) *
                    recentSalesTable.getState().pagination.pageSize,
                  recentSales.length
                )}{' '}
                of {recentSales.length} sale{recentSales.length !== 1 ? 's' : ''}
              </div>
              <div className='flex items-center space-x-2'>
                <div className='text-sm text-muted-foreground'>
                  Page {recentSalesTable.getState().pagination.pageIndex + 1} of{' '}
                  {recentSalesTable.getPageCount() || 1}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => recentSalesTable.previousPage()}
                  disabled={!recentSalesTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => recentSalesTable.nextPage()}
                  disabled={!recentSalesTable.getCanNextPage()}
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
