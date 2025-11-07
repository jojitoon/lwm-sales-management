'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  IconTrendingUp,
  IconPackage,
  IconCurrencyDollar,
  IconShoppingCart,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface RoleBasedDashboardProps {
  workspace: string;
}

export function RoleBasedDashboard({ workspace }: RoleBasedDashboardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', workspace],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <div className='h-4 bg-gray-200 rounded w-24 mb-2'></div>
              <div className='h-8 bg-gray-200 rounded w-32'></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const dashboardData = data?.data || {};

  if (workspace === 'book-sales') {
    return <BookSalesDashboard data={dashboardData} />;
  }

  if (workspace === 'table-manager') {
    return <TableManagerDashboard data={dashboardData} />;
  }

  if (workspace === 'pre-order') {
    return <PreOrderDashboard data={dashboardData} />;
  }

  // Default/Admin view - show empty or generic content
  return null;
}

function BookSalesDashboard({ data }: { data: any }) {
  const {
    totalSales = 0,
    totalItems = 0,
    uniqueBooks = 0,
    totalTransactions = 0,
  } = data;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Sales</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            ₦{totalSales.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconCurrencyDollar className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Total revenue from sales
          </div>
          <div className='text-muted-foreground'>Current session</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Items Sold</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {totalItems.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconPackage className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Total units sold
          </div>
          <div className='text-muted-foreground'>All book sales</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Unique Books</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {uniqueBooks}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconTrendingUp className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Different books sold
          </div>
          <div className='text-muted-foreground'>Variety in sales</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Transactions</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {totalTransactions}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconShoppingCart className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Total sales transactions
          </div>
          <div className='text-muted-foreground'>Completed orders</div>
        </CardFooter>
      </Card>
    </div>
  );
}

function TableManagerDashboard({ data }: { data: any }) {
  const {
    totalBooks = 0,
    totalStockValue = 0,
    totalSoldValue = 0,
    totalRemainingValue = 0,
  } = data;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Books</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {totalBooks}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconPackage className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Books in inventory
          </div>
          <div className='text-muted-foreground'>Current session</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Stock Value</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            ₦{totalStockValue.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconCurrencyDollar className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Initial stock value
          </div>
          <div className='text-muted-foreground'>All books received</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Sold Value</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            ₦{totalSoldValue.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='text-green-600'>
              <IconTrendingUp className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Value of books sold
          </div>
          <div className='text-muted-foreground'>Revenue generated</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Remaining Value</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            ₦{totalRemainingValue.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconPackage className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Remaining stock value
          </div>
          <div className='text-muted-foreground'>Available inventory</div>
        </CardFooter>
      </Card>
    </div>
  );
}

function PreOrderDashboard({ data }: { data: any }) {
  const {
    totalOrders = 0,
    totalItems = 0,
    totalValue = 0,
    collectedOrders = 0,
    pendingOrders = 0,
  } = data;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Orders</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {totalOrders}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconShoppingCart className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Order confirmations
          </div>
          <div className='text-muted-foreground'>Current session</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Items</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {totalItems.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconPackage className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Total items ordered
          </div>
          <div className='text-muted-foreground'>Across all orders</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Value</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            ₦{totalValue.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconCurrencyDollar className='h-3 w-3' />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Total order value
          </div>
          <div className='text-muted-foreground'>All confirmations</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Collection Status</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {collectedOrders}/{totalOrders}
          </CardTitle>
          <CardAction>
            <Badge
              variant='outline'
              className={
                pendingOrders > 0 ? 'text-orange-600' : 'text-green-600'
              }
            >
              {pendingOrders > 0 ? (
                <IconClock className='h-3 w-3' />
              ) : (
                <IconCheck className='h-3 w-3' />
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            {collectedOrders} collected, {pendingOrders} pending
          </div>
          <div className='text-muted-foreground'>Order status</div>
        </CardFooter>
      </Card>
    </div>
  );
}
