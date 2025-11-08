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
import { ArrowRight, Package, TrendingDown } from 'lucide-react';

interface ClosingStockReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function ClosingStockReport({
  data,
  workspace,
  isAdmin,
}: ClosingStockReportProps) {
  if (!data) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-gray-500'>No closing stock data available</div>
      </div>
    );
  }

  const { totalClosings, totalItemsReturned, closingStockFlow, bookReturns } =
    data;

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Closings
            </CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalClosings || 0}</div>
            <p className='text-xs text-muted-foreground'>
              Stock closing operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Items Returned
            </CardTitle>
            <TrendingDown className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalItemsReturned || 0}</div>
            <p className='text-xs text-muted-foreground'>
              Books returned to source
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Unique Books Returned
            </CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {bookReturns?.length || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Different book titles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Closing Stock Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Closing Stock Flow</CardTitle>
          <CardDescription>
            Complete inventory flow showing stock returns from table managers to
            mini stores and mini stores to main stores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {closingStockFlow && closingStockFlow.length > 0 ? (
            <div className='space-y-4'>
              {closingStockFlow.map((flow: any, index: number) => (
                <Card key={index} className='border-l-4 border-l-blue-500'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4'>
                        <div>
                          <Badge variant='outline' className='mb-1'>
                            {flow.from.type === 'table-manager'
                              ? 'Table Manager'
                              : flow.from.type === 'mini-store'
                              ? 'Mini Store'
                              : 'Main Store'}
                          </Badge>
                          <p className='font-semibold'>{flow.from.name}</p>
                        </div>
                        <ArrowRight className='h-5 w-5 text-gray-400' />
                        <div>
                          <Badge variant='outline' className='mb-1'>
                            {flow.to.type === 'table-manager'
                              ? 'Table Manager'
                              : flow.to.type === 'mini-store'
                              ? 'Mini Store'
                              : 'Main Store'}
                          </Badge>
                          <p className='font-semibold'>{flow.to.name}</p>
                        </div>
                      </div>
                      <div className='text-right text-sm text-gray-500'>
                        <p>
                          {flow.closedAt
                            ? new Date(flow.closedAt).toLocaleString()
                            : 'N/A'}
                        </p>
                        <p className='text-xs'>by {flow.closedBy || 'N/A'}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <div className='flex gap-4 text-sm'>
                        <span>
                          <strong>Items:</strong> {flow.totalItems || 0}
                        </span>
                        <span>
                          <strong>Quantity:</strong> {flow.totalQuantity || 0}
                        </span>
                      </div>
                      {flow.items && flow.items.length > 0 && (
                        <div className='mt-3'>
                          <p className='text-sm font-medium mb-2'>
                            Returned Items:
                          </p>
                          <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                            {flow.items.map((item: any, itemIndex: number) => (
                              <div
                                key={itemIndex}
                                className='text-xs p-2 bg-gray-50 rounded'
                              >
                                <p className='font-medium'>{item.title}</p>
                                <p className='text-gray-600'>
                                  Qty: {item.quantity}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              No closing stock data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Returns Summary */}
      {bookReturns && bookReturns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Book Returns Summary</CardTitle>
            <CardDescription>
              Total quantities returned by book title
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead className='text-right'>
                      Total Quantity Returned
                    </TableHead>
                    <TableHead className='text-right'>
                      Number of Returns
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookReturns.map((book: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>
                        {book.title}
                      </TableCell>
                      <TableCell className='text-right'>
                        {book.totalQuantity}
                      </TableCell>
                      <TableCell className='text-right'>
                        {book.numberOfReturns}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
