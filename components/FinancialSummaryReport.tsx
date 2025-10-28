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
  IconCurrencyDollar,
  IconTrendingUp,
  IconPackage,
} from '@tabler/icons-react';

interface FinancialSummaryReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function FinancialSummaryReport({
  data,
  workspace,
  isAdmin,
}: FinancialSummaryReportProps) {
  if (!data) return <div>No data available</div>;

  const {
    totalRevenue,
    totalItemsSold,
    averageOrderValue,
    dailyRevenue,
    topSellingBooks,
  } = data;

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <IconCurrencyDollar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₦{totalRevenue.toLocaleString()}
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
              {totalItemsSold.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>Total units sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg Order Value
            </CardTitle>
            <IconTrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₦{averageOrderValue.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Average per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue Trend</CardTitle>
          <CardDescription>Revenue breakdown by day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {dailyRevenue.slice(-7).map((day: any, index: number) => (
              <div
                key={index}
                className='flex items-center justify-between p-2 border rounded'
              >
                <span className='font-medium'>
                  {new Date(day.date).toLocaleDateString()}
                </span>
                <div className='flex items-center gap-4'>
                  <span className='text-sm text-gray-600'>
                    ₦{day.revenue.toLocaleString()}
                  </span>
                  <div className='w-32 bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full'
                      style={{
                        width: `${Math.min(
                          100,
                          (day.revenue /
                            Math.max(
                              ...dailyRevenue.map((d: any) => d.revenue)
                            )) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Books */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Books</CardTitle>
          <CardDescription>Best performing books by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Book Title</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Quantity Sold</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSellingBooks.map((book: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant={index < 3 ? 'default' : 'outline'}>
                      #{index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className='font-medium'>{book.book}</TableCell>
                  <TableCell className='font-medium'>
                    ₦{book.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell>{book.quantity}</TableCell>
                  <TableCell>
                    {book.revenue > 50000 ? (
                      <Badge variant='default' className='bg-green-600'>
                        Excellent
                      </Badge>
                    ) : book.revenue > 20000 ? (
                      <Badge variant='default' className='bg-blue-600'>
                        Good
                      </Badge>
                    ) : book.revenue > 5000 ? (
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

      {/* Revenue Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Insights</CardTitle>
          <CardDescription>Key financial metrics and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <h4 className='font-medium'>Revenue Distribution</h4>
              <div className='text-sm text-gray-600'>
                <div>Total Revenue: ₦{totalRevenue.toLocaleString()}</div>
                <div>Items Sold: {totalItemsSold.toLocaleString()}</div>
                <div>
                  Average Price: ₦
                  {totalItemsSold > 0
                    ? (totalRevenue / totalItemsSold).toFixed(2)
                    : 0}
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <h4 className='font-medium'>Performance Metrics</h4>
              <div className='text-sm text-gray-600'>
                <div>
                  Best Day: ₦
                  {Math.max(
                    ...dailyRevenue.map((d: any) => d.revenue)
                  ).toLocaleString()}
                </div>
                <div>Top Book: {topSellingBooks[0]?.book || 'N/A'}</div>
                <div>
                  Top Book Revenue: ₦
                  {topSellingBooks[0]?.revenue?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
