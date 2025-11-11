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
import { IconTable, IconUser } from '@tabler/icons-react';

interface AdminTableManagerStockProps {
  tableSaleSessions: any[];
}

export function AdminTableManagerStock({
  tableSaleSessions: initialTableSaleSessions,
}: AdminTableManagerStockProps) {
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tableSaleSessions, setTableSaleSessions] = useState(initialTableSaleSessions);
  const router = useRouter();

  const handleViewStock = (tableSession: any) => {
    setSelectedTable(tableSession);
    setDialogOpen(true);
  };

  const stock = selectedTable
    ? ((selectedTable.data as any)?.list || [])
    : [];
  const isStockClosed = selectedTable
    ? !!((selectedTable.data as any)?.closingStock)
    : false;

  const tableManagers = tableSaleSessions.map((session) => {
    const managerSession = session.mySessions.find(
      (s: any) => s.workspace === 'table-manager'
    );
    const preorderSession = session.mySessions.find(
      (s: any) => s.workspace === 'pre-order'
    );
    return {
      ...session,
      manager: managerSession?.user || preorderSession?.user || null,
      managerEmail: managerSession?.user?.email || preorderSession?.user?.email || 'N/A',
    };
  });

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {tableManagers.map((table) => {
          const stockList = (table.data as any)?.list || [];
          const totalBooks = stockList.length;
          const totalQuantity = stockList.reduce(
            (sum: number, book: any) => sum + (book.available || 0),
            0
          );
          const isClosed = !!((table.data as any)?.closingStock);

          return (
            <Card key={table.id} className='cursor-pointer hover:shadow-lg transition-shadow'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <IconTable className='h-5 w-5' />
                    <CardTitle className='text-lg'>{table.tableId}</CardTitle>
                  </div>
                  {isClosed && (
                    <Badge variant='destructive' className='text-xs'>
                      Closed
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {table.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm'>
                    <IconUser className='h-4 w-4 text-gray-500' />
                    <span className='text-gray-600'>
                      {table.managerEmail}
                    </span>
                  </div>
                  <div className='text-sm text-gray-600'>
                    <div>Books: {totalBooks}</div>
                    <div>Total Quantity: {totalQuantity}</div>
                  </div>
                  <Button
                    onClick={() => handleViewStock(table)}
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
              Table Stock: {selectedTable?.tableId} - {selectedTable?.name}
            </DialogTitle>
            <DialogDescription>
              Manager: {selectedTable && (tableManagers.find(t => t.id === selectedTable.id)?.managerEmail || 'N/A')}
            </DialogDescription>
          </DialogHeader>

          {selectedTable && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                {isStockClosed && (
                  <Badge variant='destructive'>Stock Closed</Badge>
                )}
                {isStockClosed ? (
                  <OpenStockButton
                    workspace='table-manager'
                    tableSaleSessionId={selectedTable.id}
                    onSuccess={() => {
                      // Refresh the page to update stock status
                      router.refresh();
                      // Update local state
                      setTableSaleSessions((prev) =>
                        prev.map((t) =>
                          t.id === selectedTable.id
                            ? {
                                ...t,
                                data: {
                                  ...t.data,
                                  closingStock: undefined,
                                },
                              }
                            : t
                        )
                      );
                      // Update selected table
                      setSelectedTable((prev: any) =>
                        prev
                          ? {
                              ...prev,
                              data: {
                                ...prev.data,
                                closingStock: undefined,
                              },
                            }
                          : null
                      );
                    }}
                  />
                ) : (
                  <CloseStockButton
                    workspace='table-manager'
                    tableSaleSessionId={selectedTable.id}
                    onSuccess={() => {
                      // Refresh the page to update stock status
                      router.refresh();
                      // Update local state
                      setTableSaleSessions((prev) =>
                        prev.map((t) =>
                          t.id === selectedTable.id
                            ? {
                                ...t,
                                data: {
                                  ...t.data,
                                  closingStock: {
                                    closedAt: new Date().toISOString(),
                                    closedBy: 'Admin',
                                  },
                                },
                              }
                            : t
                        )
                      );
                      // Update selected table
                      setSelectedTable((prev: any) =>
                        prev
                          ? {
                              ...prev,
                              data: {
                                ...prev.data,
                                closingStock: {
                                  closedAt: new Date().toISOString(),
                                  closedBy: 'Admin',
                                },
                              },
                            }
                          : null
                      );
                    }}
                  />
                )}
              </div>

              <BookStockTable 
                key={selectedTable.id} 
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

