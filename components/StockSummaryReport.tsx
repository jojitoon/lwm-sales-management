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
import { Package, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StockSummaryReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function StockSummaryReport({
  data,
  workspace,
  isAdmin,
}: StockSummaryReportProps) {
  const [openTables, setOpenTables] = useState<Record<string, boolean>>({});
  const [showReturnedBooksModal, setShowReturnedBooksModal] = useState(false);

  if (!data) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-gray-500'>No stock summary data available</div>
      </div>
    );
  }

  const {
    totalTables,
    totalMiniStores,
    totalBooksDistributed,
    totalBooksReturned,
    tables,
    miniStores,
    isMiniStoreClosed,
    closedAt,
    closedBy,
    booksReturnedToMainStore = [],
    totalBooksReturnedToMainStore = 0,
    isMainStore = false,
  } = data;

  const isMainStoreView = isMainStore || workspace === 'main-store';
  const items = isMainStoreView ? miniStores || [] : tables || [];
  const totalItems = isMainStoreView ? totalMiniStores || 0 : totalTables || 0;

  const toggleItem = (itemId: string) => {
    setOpenTables((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {isMainStoreView ? 'Total Mini Stores' : 'Total Tables'}
            </CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalItems}</div>
            <p className='text-xs text-muted-foreground'>
              {isMainStoreView
                ? 'Mini stores with stock distribution'
                : 'Tables with stock distribution'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Books Distributed
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {totalBooksDistributed || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {isMainStoreView
                ? 'Books given to mini stores'
                : 'Books given to tables'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Books Returned
            </CardTitle>
            <TrendingDown className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalBooksReturned || 0}</div>
            <p className='text-xs text-muted-foreground'>
              {isMainStoreView
                ? 'Books returned from mini stores'
                : 'Books returned from tables'}
            </p>
          </CardContent>
        </Card>

        {isMiniStoreClosed && (
          <Card
            className='cursor-pointer hover:bg-gray-50 transition-colors'
            onClick={() => setShowReturnedBooksModal(true)}
          >
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Returned to Main Store
              </CardTitle>
              <Info className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {totalBooksReturnedToMainStore || 0}
              </div>
              <p className='text-xs text-muted-foreground'>
                Click to view details
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Items Summary (Tables or Mini Stores) */}
      <Card>
        <CardHeader>
          <CardTitle>
            Stock Summary by {isMainStoreView ? 'Mini Store' : 'Table'}
          </CardTitle>
          <CardDescription>
            {isMainStoreView
              ? 'Breakdown of books given and returned for each mini store session'
              : 'Breakdown of books given, collected, and returned for each table session'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items && items.length > 0 ? (
            <div className='space-y-4'>
              {items.map((item: any) => {
                const itemId = item.tableId || item.miniStoreId;
                const itemName = item.tableName || item.miniStoreName || itemId;
                return (
                  <Card key={itemId} className='border-l-4 border-l-blue-500'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => toggleItem(itemId)}
                            className='h-8 w-8 p-0'
                          >
                            {openTables[itemId] ? (
                              <ChevronDown className='h-5 w-5' />
                            ) : (
                              <ChevronRight className='h-5 w-5' />
                            )}
                          </Button>
                          <div>
                            <Badge variant='outline' className='mb-1'>
                              {isMainStoreView ? 'Mini Store' : 'Table'}{' '}
                              {itemId}
                            </Badge>
                            <p className='font-semibold'>{itemName}</p>
                          </div>
                        </div>
                        <div className='flex gap-4 text-sm'>
                          <div className='text-right'>
                            <p className='text-gray-500'>Given</p>
                            <p className='font-semibold'>
                              {item.totalBooksGiven || 0}
                            </p>
                          </div>
                          {!isMainStoreView && (
                            <div className='text-right'>
                              <p className='text-gray-500'>Collected</p>
                              <p className='font-semibold'>
                                {item.totalBooksCollected || 0}
                              </p>
                            </div>
                          )}
                          <div className='text-right'>
                            <p className='text-gray-500'>Returned</p>
                            <p className='font-semibold'>
                              {item.totalBooksReturned || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {openTables[itemId] && (
                      <CardContent>
                        <div className='rounded-md border'>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Book Title</TableHead>
                                <TableHead className='text-right'>Given</TableHead>
                                {!isMainStoreView && (
                                  <TableHead className='text-right'>
                                    Collected
                                  </TableHead>
                                )}
                                <TableHead className='text-right'>
                                  Returned
                                </TableHead>
                                <TableHead className='text-right'>
                                  {isMainStoreView ? 'Distributed' : 'Remaining'}
                                </TableHead>
                                <TableHead className='text-right'>
                                  Unit Price
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.bookDetails &&
                              item.bookDetails.length > 0 ? (
                                item.bookDetails.map(
                                  (book: any, index: number) => (
                                    <TableRow key={index}>
                                      <TableCell className='font-medium'>
                                        {book.title}
                                      </TableCell>
                                      <TableCell className='text-right'>
                                        {book.given}
                                      </TableCell>
                                      {!isMainStoreView && (
                                        <TableCell className='text-right'>
                                          {book.collected || 0}
                                        </TableCell>
                                      )}
                                      <TableCell className='text-right'>
                                        {book.returned}
                                      </TableCell>
                                      <TableCell className='text-right'>
                                        {book.remaining}
                                      </TableCell>
                                      <TableCell className='text-right'>
                                        {new Intl.NumberFormat('en-US', {
                                          style: 'currency',
                                          currency: 'NGN',
                                        }).format(book.unitPrice)}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={isMainStoreView ? 5 : 6}
                                    className='h-24 text-center'
                                  >
                                    No books found for this{' '}
                                    {isMainStoreView ? 'mini store' : 'table'}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              No {isMainStoreView ? 'mini store' : 'table'} data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for Books Returned to Main Store */}
      <Dialog open={showReturnedBooksModal} onOpenChange={setShowReturnedBooksModal}>
        <DialogContent className='max-w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Books Returned to Main Store</DialogTitle>
            <DialogDescription>
              {closedAt && (
                <div className='mt-2 text-sm'>
                  Closed on:{' '}
                  {new Date(closedAt).toLocaleString()}
                  {closedBy && ` by ${closedBy}`}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4'>
            {booksReturnedToMainStore && booksReturnedToMainStore.length > 0 ? (
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead className='text-right'>Quantity</TableHead>
                      <TableHead className='text-right'>Unit Price</TableHead>
                      <TableHead className='text-right'>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booksReturnedToMainStore.map((book: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className='font-medium'>{book.title}</TableCell>
                        <TableCell className='text-right'>{book.quantity}</TableCell>
                        <TableCell className='text-right'>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'NGN',
                          }).format(book.price)}
                        </TableCell>
                        <TableCell className='text-right font-medium'>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'NGN',
                          }).format(book.quantity * book.price)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className='font-bold'>
                      <TableCell>Total</TableCell>
                      <TableCell className='text-right'>
                        {totalBooksReturnedToMainStore}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className='text-right'>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'NGN',
                        }).format(
                          booksReturnedToMainStore.reduce(
                            (sum, book) => sum + book.quantity * book.price,
                            0
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                No books were returned to main store
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

