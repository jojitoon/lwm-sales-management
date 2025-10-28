'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconClock,
  IconCheck,
  IconX,
  IconTrendingUp,
} from '@tabler/icons-react';

interface RequestStatusReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function RequestStatusReport({
  data,
  workspace,
  isAdmin,
}: RequestStatusReportProps) {
  if (!data) return <div>No data available</div>;

  const {
    totalRequests,
    pendingRequests,
    approvedRequests,
    deniedRequests,
    approvalRate,
    requests,
  } = data;

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Requests
            </CardTitle>
            <IconTrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalRequests}</div>
            <p className='text-xs text-muted-foreground'>All requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pending</CardTitle>
            <IconClock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {pendingRequests}
            </div>
            <p className='text-xs text-muted-foreground'>Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Approved</CardTitle>
            <IconCheck className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {approvedRequests}
            </div>
            <p className='text-xs text-muted-foreground'>
              Successfully approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Denied</CardTitle>
            <IconX className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {deniedRequests}
            </div>
            <p className='text-xs text-muted-foreground'>Rejected requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Rate</CardTitle>
          <CardDescription>
            Overall request approval performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-4'>
            <div className='text-3xl font-bold'>{approvalRate.toFixed(1)}%</div>
            <div className='flex-1'>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-green-600 h-2 rounded-full'
                  style={{ width: `${approvalRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>Detailed view of all requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Badge variant='outline'>
                      {request.type === 'main-store'
                        ? 'Main Store'
                        : 'Mini Store'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.status === 'approved' ? (
                      <Badge variant='default' className='bg-green-600'>
                        <IconCheck className='h-3 w-3 mr-1' />
                        Approved
                      </Badge>
                    ) : request.status === 'denied' ? (
                      <Badge variant='destructive'>
                        <IconX className='h-3 w-3 mr-1' />
                        Denied
                      </Badge>
                    ) : (
                      <Badge variant='secondary'>
                        <IconClock className='h-3 w-3 mr-1' />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {request.requestData?.items ? (
                      <div className='text-sm'>
                        {request.requestData.totalItems} items
                        <div className='text-gray-500'>
                          {request.requestData.totalQuantity} units
                        </div>
                      </div>
                    ) : (
                      <div className='text-sm'>
                        {request.requestData?.bookTitle || 'N/A'}
                        <div className='text-gray-500'>
                          Qty: {request.requestData?.quantity || 0}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant='outline' size='sm'>
                      View Details
                    </Button>
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
