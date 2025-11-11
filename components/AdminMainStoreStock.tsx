'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookStockTable } from '@/components/BookStockTable';
import { CloseStockButton } from '@/components/CloseStockButton';
import { OpenStockButton } from '@/components/OpenStockButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconBuildingStore, IconUser } from '@tabler/icons-react';

interface AdminMainStoreStockProps {
  mainStoreSessions: any[];
}

export function AdminMainStoreStock({
  mainStoreSessions: initialMainStoreSessions,
}: AdminMainStoreStockProps) {
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mainStoreSessions, setMainStoreSessions] = useState(initialMainStoreSessions);
  const router = useRouter();

  const handleViewStock = (storeSession: any) => {
    setSelectedStore(storeSession);
    setDialogOpen(true);
  };

  const stock = selectedStore
    ? ((selectedStore.data as any)?.list || [])
    : [];
  const isStockClosed = selectedStore
    ? !!(selectedStore.closingStock)
    : false;

  const mainStores = mainStoreSessions.map((session) => {
    const managerSession = session.mySessions.find(
      (s: any) => s.workspace === 'main-store'
    );
    return {
      ...session,
      manager: managerSession?.user || null,
      managerEmail: managerSession?.user?.email || 'N/A',
    };
  });

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {mainStores.map((store) => {
          const stockList = (store.data as any)?.list || [];
          const totalBooks = stockList.length;
          const totalQuantity = stockList.reduce(
            (sum: number, book: any) => sum + (book.available || 0),
            0
          );
          const isClosed = !!(store.closingStock);

          return (
            <Card key={store.id} className='cursor-pointer hover:shadow-lg transition-shadow'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <IconBuildingStore className='h-5 w-5' />
                    <CardTitle className='text-lg'>{store.name}</CardTitle>
                  </div>
                  {isClosed && (
                    <Badge variant='destructive' className='text-xs'>
                      Closed
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Session: {store.session}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm'>
                    <IconUser className='h-4 w-4 text-gray-500' />
                    <span className='text-gray-600'>
                      {store.managerEmail}
                    </span>
                  </div>
                  <div className='text-sm text-gray-600'>
                    <div>Books: {totalBooks}</div>
                    <div>Total Quantity: {totalQuantity}</div>
                  </div>
                  <Button
                    onClick={() => handleViewStock(store)}
                    className='w-full mt-4'
                    variant={isClosed ? 'outline' : 'default'}
                  >
                    {isClosed ? 'View Stock' : 'View & Manage Stock'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-[calc(100vw-2rem)] sm:max-w-6xl max-h-[calc(100vh-2rem)] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              Main Store Stock: {selectedStore?.name}
            </DialogTitle>
            <DialogDescription>
              Manager: {selectedStore && (mainStores.find(s => s.id === selectedStore.id)?.managerEmail || 'N/A')}
              <br />
              Session: {selectedStore?.session}
            </DialogDescription>
          </DialogHeader>

          {selectedStore && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                {isStockClosed && (
                  <Badge variant='destructive'>Stock Closed</Badge>
                )}
                {isStockClosed ? (
                  <OpenStockButton 
                    workspace='main-store'
                    mainStoreSessionId={selectedStore.id}
                    onSuccess={() => {
                      // Refresh the page to update stock status
                      router.refresh();
                      // Update local state
                      setMainStoreSessions((prev) =>
                        prev.map((s) =>
                          s.id === selectedStore.id
                            ? {
                                ...s,
                                closingStock: null,
                                closedAt: null,
                              }
                            : s
                        )
                      );
                      // Update selected store
                      setSelectedStore((prev: any) =>
                        prev
                          ? {
                              ...prev,
                              closingStock: null,
                              closedAt: null,
                            }
                          : null
                      );
                    }}
                  />
                ) : (
                  <CloseStockButton
                    workspace='main-store'
                    mainStoreSessionId={selectedStore.id}
                    onSuccess={() => {
                      // Refresh the page to update stock status
                      router.refresh();
                      // Update local state
                      setMainStoreSessions((prev) =>
                        prev.map((s) =>
                          s.id === selectedStore.id
                            ? {
                                ...s,
                                closingStock: {
                                  closedAt: new Date().toISOString(),
                                  closedBy: 'Admin',
                                },
                              }
                            : s
                        )
                      );
                      // Update selected store
                      setSelectedStore((prev: any) =>
                        prev
                          ? {
                              ...prev,
                              closingStock: {
                                closedAt: new Date().toISOString(),
                                closedBy: 'Admin',
                              },
                            }
                          : null
                      );
                    }}
                  />
                )}
              </div>

              <BookStockTable 
                key={selectedStore.id} 
                data={stock} 
                disableFetch={true} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

