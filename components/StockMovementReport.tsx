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

  const { totalBooks, totalStockValue, lowStockBooks, stockMovement } = data;

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
            <CardTitle className='text-sm font-medium'>Stock Value</CardTitle>
            <IconTrendingDown className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₦{totalStockValue.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Total inventory value
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
                  className='flex justify-between items-center p-2 bg-white rounded border'
                >
                  <span className='font-medium'>{book.title}</span>
                  <Badge variant='destructive'>
                    Only {book.remainingStock} left
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book Title</TableHead>
                <TableHead>Initial Stock</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockMovement.map((book: any) => (
                <TableRow key={book.bookId}>
                  <TableCell className='font-medium'>{book.title}</TableCell>
                  <TableCell>{book.initialStock}</TableCell>
                  <TableCell>{book.soldQuantity}</TableCell>
                  <TableCell>{book.remainingStock}</TableCell>
                  <TableCell>₦{book.price.toLocaleString()}</TableCell>
                  <TableCell className='font-medium'>
                    ₦{book.totalValue.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {book.remainingStock < 10 ? (
                      <Badge variant='destructive'>Low Stock</Badge>
                    ) : book.remainingStock < 50 ? (
                      <Badge variant='secondary'>Medium Stock</Badge>
                    ) : (
                      <Badge variant='default'>Good Stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
