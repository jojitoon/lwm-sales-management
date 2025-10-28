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
import { IconUsers, IconTrendingUp, IconPackage } from '@tabler/icons-react';

interface UserPerformanceReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function UserPerformanceReport({
  data,
  workspace,
  isAdmin,
}: UserPerformanceReportProps) {
  if (!data) return <div>No data available</div>;

  const { totalUsers, activeUsers, topPerformers, userPerformance } = data;

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
            <IconUsers className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalUsers}</div>
            <p className='text-xs text-muted-foreground'>Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
            <IconTrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {activeUsers}
            </div>
            <p className='text-xs text-muted-foreground'>Users with sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Activity Rate</CardTitle>
            <IconPackage className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {totalUsers > 0
                ? ((activeUsers / totalUsers) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className='text-xs text-muted-foreground'>User engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>
            Users with highest sales performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Items Sold</TableHead>
                <TableHead>Unique Books</TableHead>
                <TableHead>Avg Order Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPerformers.map((user: any, index: number) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <Badge variant={index < 3 ? 'default' : 'outline'}>
                      #{index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-medium'>
                        {user.name || user.email}
                      </div>
                      <div className='text-sm text-gray-500'>{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>
                      {user.workspace.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className='font-medium'>
                    ₦{user.totalSales.toLocaleString()}
                  </TableCell>
                  <TableCell>{user.totalItems}</TableCell>
                  <TableCell>{user.uniqueBooks}</TableCell>
                  <TableCell>
                    ₦{user.averageOrderValue.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* All Users Performance */}
      <Card>
        <CardHeader>
          <CardTitle>All Users Performance</CardTitle>
          <CardDescription>Complete performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Items Sold</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userPerformance.map((user: any) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div>
                      <div className='font-medium'>
                        {user.name || user.email}
                      </div>
                      <div className='text-sm text-gray-500'>{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>
                      {user.workspace.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className='font-medium'>
                    ₦{user.totalSales.toLocaleString()}
                  </TableCell>
                  <TableCell>{user.totalItems}</TableCell>
                  <TableCell>{user.transactionCount}</TableCell>
                  <TableCell>
                    {user.totalSales > 100000 ? (
                      <Badge variant='default' className='bg-green-600'>
                        Excellent
                      </Badge>
                    ) : user.totalSales > 50000 ? (
                      <Badge variant='default' className='bg-blue-600'>
                        Good
                      </Badge>
                    ) : user.totalSales > 10000 ? (
                      <Badge variant='secondary'>Average</Badge>
                    ) : (
                      <Badge variant='outline'>Low</Badge>
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
