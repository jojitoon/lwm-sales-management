'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { IconDownload, IconEye } from '@tabler/icons-react';

interface ClosingStockReportProps {
  sessionType: 'main-store' | 'mini-store';
}

interface SessionWithSummary {
  id: string;
  name?: string;
  session: string;
  managerId?: string;
  closedAt: string;
  closingStockSummary: {
    totalBooks: number;
    totalQuantity: number;
    totalValue: number;
    books: any[];
  };
}

export function ClosingStockReport({ sessionType }: ClosingStockReportProps) {
  const [selectedSession, setSelectedSession] =
    useState<SessionWithSummary | null>(null);

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: [`closing-stock-${sessionType}`],
    queryFn: async () => {
      const response = await axios.get(
        `/api/sessions/closing-stock?type=${sessionType}`
      );
      return response.data;
    },
  });

  const sessions = sessionsData?.sessions || [];

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-32'>
        <div className='text-gray-500'>Loading closing stock data...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className='text-center py-8'>
        <div className='text-gray-500'>
          No closed sessions found for{' '}
          {sessionType === 'main-store' ? 'Main Store' : 'Mini Store'}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='bg-blue-50 p-4 rounded-lg text-center'>
          <div className='text-2xl font-bold text-blue-600'>
            {sessions.length}
          </div>
          <div className='text-gray-600'>Closed Sessions</div>
        </div>
        <div className='bg-green-50 p-4 rounded-lg text-center'>
          <div className='text-2xl font-bold text-green-600'>
            {sessions.reduce(
              (sum, s) => sum + s.closingStockSummary.totalBooks,
              0
            )}
          </div>
          <div className='text-gray-600'>Total Books</div>
        </div>
        <div className='bg-purple-50 p-4 rounded-lg text-center'>
          <div className='text-2xl font-bold text-purple-600'>
            ₦
            {sessions
              .reduce((sum, s) => sum + s.closingStockSummary.totalValue, 0)
              .toLocaleString()}
          </div>
          <div className='text-gray-600'>Total Value</div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Store Name</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Closed At</TableHead>
              <TableHead>Books</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session: SessionWithSummary) => (
              <TableRow key={session.id}>
                <TableCell className='font-medium'>{session.session}</TableCell>
                <TableCell>{session.name || 'N/A'}</TableCell>
                <TableCell>{session.managerId || 'N/A'}</TableCell>
                <TableCell>
                  {new Date(session.closedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant='secondary'>
                    {session.closingStockSummary.totalBooks}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant='outline'>
                    {session.closingStockSummary.totalQuantity}
                  </Badge>
                </TableCell>
                <TableCell className='font-medium'>
                  ₦{session.closingStockSummary.totalValue.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setSelectedSession(session)}
                    >
                      <IconEye className='h-4 w-4 mr-1' />
                      View
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        // Export functionality could be implemented here
                        console.log('Export session:', session.id);
                      }}
                    >
                      <IconDownload className='h-4 w-4 mr-1' />
                      Export
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-bold'>
                Closing Stock Details - {selectedSession.session}
              </h2>
              <Button
                variant='outline'
                onClick={() => setSelectedSession(null)}
              >
                Close
              </Button>
            </div>

            <div className='space-y-4'>
              <div className='grid grid-cols-3 gap-4'>
                <div className='bg-blue-50 p-3 rounded text-center'>
                  <div className='text-lg font-bold text-blue-600'>
                    {selectedSession.closingStockSummary.totalBooks}
                  </div>
                  <div className='text-sm text-gray-600'>Books</div>
                </div>
                <div className='bg-green-50 p-3 rounded text-center'>
                  <div className='text-lg font-bold text-green-600'>
                    {selectedSession.closingStockSummary.totalQuantity}
                  </div>
                  <div className='text-sm text-gray-600'>Quantity</div>
                </div>
                <div className='bg-purple-50 p-3 rounded text-center'>
                  <div className='text-lg font-bold text-purple-600'>
                    ₦
                    {selectedSession.closingStockSummary.totalValue.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600'>Value</div>
                </div>
              </div>

              <div className='border rounded-lg'>
                <div className='p-3 border-b bg-gray-50'>
                  <h3 className='font-semibold'>Stock Details</h3>
                </div>
                <div className='max-h-60 overflow-y-auto'>
                  {selectedSession.closingStockSummary.books.map(
                    (book: any, index: number) => (
                      <div
                        key={index}
                        className='flex justify-between items-center p-3 border-b last:border-b-0'
                      >
                        <div className='flex-1'>
                          <span className='font-medium'>{book.title}</span>
                        </div>
                        <div className='flex items-center gap-4 text-sm text-gray-600'>
                          <span>Available: {book.available}</span>
                          <span>Price: ₦{book.price?.toLocaleString()}</span>
                          <span className='font-medium'>
                            Value: ₦
                            {(
                              (book.price || 0) * (book.available || 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
