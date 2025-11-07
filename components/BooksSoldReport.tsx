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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book Title</TableHead>
                <TableHead>Quantity Sold</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {booksSold && booksSold.length > 0 ? (
                booksSold.map((book: any, index: number) => (
                  <TableRow key={book.bookId || index}>
                    <TableCell className='font-medium'>{book.title}</TableCell>
                    <TableCell>{book.quantity}</TableCell>
                    <TableCell>₦{book.price.toLocaleString()}</TableCell>
                    <TableCell className='font-medium'>
                      ₦{book.value.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-center text-muted-foreground'
                  >
                    No books sold yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
