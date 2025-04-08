'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Loading from '@/app/loading';

const getOrder = async (orderId: string) => {
  const { data } = await axios.get(`/api/pre-orders/${orderId}`);
  return data;
};

const collectOrder = async ({ id, items }: { id: string; items: string[] }) => {
  const { data } = await axios.post(`/api/pre-orders/${id}/collect`, {
    items,
  });
  return data;
};

export default function Home() {
  const [orderId, setOrderId] = useState('');
  const [tempOrderId, setTempOrderId] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const validCurrentItems = useMemo(() => {
    if (!currentOrder) return [];
    return currentOrder.items?.filter((item: any) => !item.isCollected) || [];
  }, [currentOrder]);

  const { data, refetch } = useQuery({
    queryKey: ['order', orderId],
    enabled: !!orderId,
    queryFn: () => getOrder(orderId),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, items }: { id: string; items: string[] }) =>
      collectOrder({ id, items }),
    onError: (error) => {
      console.error(error);
      toast.error(error.message);
    },
    onSuccess: () => {
      refetch();
      setCurrentOrder(null);
      setSelectedItems([]);
      toast.success('Order collected successfully');
    },
  });

  const onConfirm = () => {
    mutate({
      id: currentOrder?.id || '',
      items: selectedItems,
    });
  };

  return (
    <main className='px-4 lg:px-6'>
      <h1 className='text-2xl font-bold my-2'>Process Preorder</h1>
      <div className='flex gap-4 my-4'>
        <Input
          placeholder='Enter email address or order ID'
          value={tempOrderId}
          onChange={(e) => setTempOrderId(e.target.value)}
        />
        <Button onClick={() => setOrderId(tempOrderId)}>Search</Button>
      </div>
      <div className='flex justify-end mb-4'>
        {orderId && (
          <p
            className='underline cursor-pointer'
            onClick={() => {
              setOrderId('');
              setTempOrderId('');
            }}
          >
            Clear all
          </p>
        )}
      </div>

      <div className='flex flex-col gap-4'>
        {isPending && <Loading />}
        {data?.length === 0 && !!orderId && (
          <div className='h-[300px] w-full flex items-center justify-center'>
            No Record Found
          </div>
        )}
        {data?.map((order: any) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>#{order.orderNumber}</CardTitle>
              <CardDescription>
                {order.fullName} - {order.email} - {order.phoneNumber} -{' '}
                <b className='text-white'>{order?.shippingZone}</b>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{order.items?.length} Books</p>
              {order.items?.map((item: any) => (
                <div
                  key={item.id}
                  className='flex flex-col gap-1 my-3'
                  style={
                    item.isCollected
                      ? {
                          textDecoration: 'line-through',
                          opacity: 0.5,
                        }
                      : {}
                  }
                >
                  <p>{item.productName}</p>
                  <p>Price: &#8358;{item.price.toLocaleString()}</p>
                  <p>Quantity: {item.quantity}</p>
                </div>
              ))}
            </CardContent>
            <CardFooter className='flex justify-between'>
              <b>Total: &#8358;{order.total?.toLocaleString()}</b>
              <Button
                disabled={order.isCollected || isPending}
                onClick={() => {
                  setCurrentOrder(order);
                }}
              >
                {order.isCollected
                  ? 'Collected'
                  : isPending
                  ? 'Working...'
                  : 'Collect Order'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Sheet open={!!currentOrder} onOpenChange={() => setCurrentOrder(null)}>
        <SheetContent className='w-[1000px] overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>#{currentOrder?.orderNumber}</SheetTitle>
            <SheetDescription>
              <h1>{currentOrder?.fullName}</h1>
              <p>{currentOrder?.email}</p>
              <p>{currentOrder?.phoneNumber}</p>
              <p>{currentOrder?.shippingZone}</p>
            </SheetDescription>
          </SheetHeader>
          <div className='flex justify-between items-center'>
            <p className='my-4'>{currentOrder?.items?.length} Books</p>
            <p
              className='cursor-pointer'
              onClick={() => {
                if (selectedItems.length === validCurrentItems?.length) {
                  setSelectedItems([]);
                } else {
                  setSelectedItems(
                    validCurrentItems?.map((item: any) => item.id) || []
                  );
                }
              }}
            >
              Select all{' '}
              <Checkbox
                className='ml-2'
                checked={selectedItems.length === validCurrentItems?.length}
              />
            </p>
          </div>
          <div className='overflow-y-auto'>
            {currentOrder?.items?.map((item: any) => (
              <Card
                key={item.id}
                className='mb-2'
                style={item.isCollected ? { opacity: 0.5 } : {}}
              >
                <CardHeader>
                  <CardTitle>{item.productName}</CardTitle>
                  <CardDescription>
                    Price: &#8358;{item.price.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex justify-between'>
                    <p>Quantity: {item.quantity}</p>
                    <Checkbox
                      disabled={item.isCollected}
                      checked={
                        item.isCollected || selectedItems.includes(item.id)
                      }
                      onCheckedChange={() => {
                        if (selectedItems.includes(item.id)) {
                          setSelectedItems(
                            selectedItems.filter((id) => id !== item.id)
                          );
                        } else {
                          setSelectedItems([...selectedItems, item.id]);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <SheetFooter className='mt-4'>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='outline'
                  disabled={selectedItems.length === 0 || isPending}
                >
                  Continue
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Collection</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div>
                      {currentOrder?.items
                        ?.filter((item: any) => selectedItems.includes(item.id))
                        ?.map((item: any) => (
                          <div key={item.id} className='my-4'>
                            <p>{item.productName}</p>
                            <b>Quantity: {item.quantity}</b>
                          </div>
                        ))}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <div className='flex justify-between w-full items-center'>
                    <p>This action cannot be undone.</p>
                    <div className='flex items-center gap-2'>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onConfirm}>
                        Confirm
                      </AlertDialogAction>
                    </div>
                  </div>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}
