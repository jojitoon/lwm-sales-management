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
import {
  IconAlertTriangle,
  IconPackage,
  IconTrendingDown,
} from '@tabler/icons-react';

interface StockMovementReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function StockMovementReport({
  data,
  workspace,
  isAdmin,
}: StockMovementReportProps) {
  if (!data) return <div>No data available</div>;

  const {
    totalBooks,
    totalStockValue,
    totalSoldValue = 0,
    totalRemainingValue = 0,
    lowStockBooks,
    stockMovement,
  } = data;

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Books</CardTitle>
            <IconPackage className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalBooks}</div>
            <p className='text-xs text-muted-foreground'>Books in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Sold Value</CardTitle>
            <IconTrendingDown className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₦{totalSoldValue.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Total value of sold books
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Remaining Value
            </CardTitle>
            <IconTrendingDown className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₦{totalRemainingValue.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Total value of remaining stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Low Stock</CardTitle>
            <IconAlertTriangle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {lowStockBooks.length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Books needing restock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockBooks.length > 0 && (
        <Card className='border-red-200 bg-red-50'>
          <CardHeader>
            <CardTitle className='text-red-800 flex items-center gap-2'>
              <IconAlertTriangle className='h-5 w-5' />
              Low Stock Alert
            </CardTitle>
            <CardDescription className='text-red-700'>
              The following books are running low on stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {lowStockBooks.map((book: any, index: number) => (
                <div
                  key={index}
                  className='flex justify-between items-center  rounded border'
                >
                  <span className='font-medium text-background'>
                    {book.title}
                  </span>
                  <Badge variant='destructive'>
                    Only {book.totalRemaining ?? book.remainingStock ?? 0} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Movement Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement</CardTitle>
          <CardDescription>Current stock levels and movement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Total Stocks Received</TableHead>
                  <TableHead>Total Sold</TableHead>
                  <TableHead>Total Remaining</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Value of Sold</TableHead>
                  <TableHead>Value of Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovement && stockMovement.length > 0 ? (
                  stockMovement.map((book: any) => (
                    <TableRow key={book.bookId}>
                      <TableCell className='font-medium'>
                        {book.title}
                      </TableCell>
                      <TableCell>
                        {book.totalStocksReceived ?? book.initialStock ?? 0}
                      </TableCell>
                      <TableCell>
                        {book.totalSold ?? book.soldQuantity ?? 0}
                      </TableCell>
                      <TableCell>
                        {book.totalRemaining ?? book.remainingStock ?? 0}
                      </TableCell>
                      <TableCell>
                        ₦{(book.unitPrice ?? book.price ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className='font-medium'>
                        ₦{(book.valueOfSold ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className='font-medium'>
                        ₦
                        {(
                          book.valueOfRemaining ??
                          book.totalValue ??
                          0
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {book.status === 'Low Stock' ? (
                          <Badge variant='destructive'>Low Stock</Badge>
                        ) : book.status === 'Medium Stock' ? (
                          <Badge variant='secondary'>Medium Stock</Badge>
                        ) : (
                          <Badge variant='default'>Good Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className='text-center text-muted-foreground'
                    >
                      No stock data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
