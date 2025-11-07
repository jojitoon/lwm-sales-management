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
  IconTrendingUp,
  IconPackage,
  IconUsers,
  IconCurrencyDollar,
} from '@tabler/icons-react';

interface SalesSummaryReportProps {
  data: any;
  workspace: string;
  isAdmin: boolean;
}

export function SalesSummaryReport({
  data,
  workspace,
  isAdmin,
}: SalesSummaryReportProps) {
  if (!data) return <div>No data available</div>;

  const {
    totalSales,
    totalItems,
    uniqueBooks,
    totalTransactions,
    salesByUser,
    recentSales,
  } = data;

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Sales</CardTitle>
            <IconCurrencyDollar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₦{totalSales.toLocaleString()}
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
              {totalItems.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>Total units sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Unique Books</CardTitle>
            <IconTrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{uniqueBooks}</div>
            <p className='text-xs text-muted-foreground'>
              Different books sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Transactions</CardTitle>
            <IconUsers className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalTransactions}</div>
            <p className='text-xs text-muted-foreground'>Total transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales by User (Admin only) */}
      {isAdmin && salesByUser && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by User</CardTitle>
            <CardDescription>Performance breakdown by user</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Items Sold</TableHead>
                  <TableHead>Unique Books</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesByUser.map((user: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{user.email}</TableCell>
                    <TableCell>₦{user.totalSales.toLocaleString()}</TableCell>
                    <TableCell>{user.totalItems}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{user.uniqueBooks}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {workspace === 'book-sales' ? (
                  <>
                    <TableHead>Slip Number</TableHead>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Books</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Book</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Sold By</TableHead>
                    <TableHead>Date</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspace === 'book-sales' ? (
                recentSales.map((sale: any) => (
                  <TableRow key={sale.orderNumber}>
                    <TableCell className='font-medium'>
                      {sale.slipNumber || '-'}
                    </TableCell>
                    <TableCell className='text-sm text-gray-600'>
                      {sale.orderNumber}
                    </TableCell>
                    <TableCell>{sale.soldBy}</TableCell>
                    <TableCell>
                      {sale.items ? (
                        sale.items.map((item: any, idx: number) => (
                          <div key={idx} className='text-sm'>
                            {item.title} (x{item.quantity})
                          </div>
                        ))
                      ) : (
                        <div className='text-sm'>{sale.productName}</div>
                      )}
                    </TableCell>
                    <TableCell className='font-medium'>
                      ₦{sale.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.soldAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                recentSales.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell className='font-medium'>
                      {sale.productName}
                    </TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>₦{sale.price?.toLocaleString()}</TableCell>
                    <TableCell className='font-medium'>
                      ₦{sale.total.toLocaleString()}
                    </TableCell>
                    <TableCell>{sale.soldBy}</TableCell>
                    <TableCell>
                      {new Date(sale.soldAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
