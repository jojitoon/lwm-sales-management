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
  IconLock,
  IconPackage,
  IconTrendingDown,
  IconEye,
} from '@tabler/icons-react';

interface SessionClosingReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function SessionClosingReport({
  data,
  workspace,
  isAdmin,
}: SessionClosingReportProps) {
  if (!data) return <div>No data available</div>;

  const {
    totalClosedSessions,
    mainStoreSessions,
    miniStoreSessions,
    sessions,
  } = data;

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Closed Sessions
            </CardTitle>
            <IconLock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalClosedSessions}</div>
            <p className='text-xs text-muted-foreground'>
              Sessions with closing stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Main Store Sessions
            </CardTitle>
            <IconPackage className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {mainStoreSessions}
            </div>
            <p className='text-xs text-muted-foreground'>Main store closures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Mini Store Sessions
            </CardTitle>
            <IconTrendingDown className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {miniStoreSessions}
            </div>
            <p className='text-xs text-muted-foreground'>Mini store closures</p>
          </CardContent>
        </Card>
      </div>

      {/* Session Details */}
      <Card>
        <CardHeader>
          <CardTitle>Closed Sessions</CardTitle>
          <CardDescription>
            Detailed view of all closed sessions with closing stock data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>Closed At</TableHead>
                <TableHead>Closing Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session: any) => {
                const closingStock = (session.closingStock as any[]) || [];
                const totalBooks = closingStock.length;
                const totalQuantity = closingStock.reduce(
                  (sum, book) => sum + (book.available || 0),
                  0
                );
                const totalValue = closingStock.reduce(
                  (sum, book) =>
                    sum + (book.price || 0) * (book.available || 0),
                  0
                );

                return (
                  <TableRow key={session.id}>
                    <TableCell className='font-medium'>
                      {session.session}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          session.type === 'main-store'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {session.type === 'main-store'
                          ? 'Main Store'
                          : 'Mini Store'}
                      </Badge>
                    </TableCell>
                    <TableCell>{session.name || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(session.closedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        <div>{totalBooks} books</div>
                        <div className='text-gray-500'>
                          {totalQuantity} units
                        </div>
                        <div className='text-gray-500'>
                          ₦{totalValue.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant='outline' size='sm'>
                        <IconEye className='h-4 w-4 mr-1' />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Closing Stock Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Closing Stock Summary</CardTitle>
          <CardDescription>
            Aggregate closing stock data across all sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {sessions.map((session: any) => {
              const closingStock = (session.closingStock as any[]) || [];
              const totalBooks = closingStock.length;
              const totalQuantity = closingStock.reduce(
                (sum, book) => sum + (book.available || 0),
                0
              );
              const totalValue = closingStock.reduce(
                (sum, book) => sum + (book.price || 0) * (book.available || 0),
                0
              );

              return (
                <div key={session.id} className='border rounded-lg p-4'>
                  <div className='flex justify-between items-center mb-2'>
                    <h4 className='font-medium'>
                      {session.session} - {session.name || 'N/A'}
                    </h4>
                    <Badge variant='outline'>
                      {session.type === 'main-store'
                        ? 'Main Store'
                        : 'Mini Store'}
                    </Badge>
                  </div>
                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div>
                      <span className='text-gray-600'>Books:</span>
                      <span className='ml-2 font-medium'>{totalBooks}</span>
                    </div>
                    <div>
                      <span className='text-gray-600'>Quantity:</span>
                      <span className='ml-2 font-medium'>{totalQuantity}</span>
                    </div>
                    <div>
                      <span className='text-gray-600'>Value:</span>
                      <span className='ml-2 font-medium'>
                        ₦{totalValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className='mt-2 text-xs text-gray-500'>
                    Closed: {new Date(session.closedAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
