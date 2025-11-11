'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WebSocketEvents } from '@/lib/websocket';
import { useState } from 'react';
import { IconPlus, IconMinus, IconTrash } from '@tabler/icons-react';

interface RequestManagementTableProps {
  requests?: any[]; // Make optional since we'll fetch client-side
  type: 'main-store' | 'mini-store';
}

export function RequestManagementTable({
  requests: initialRequests,
  type,
}: RequestManagementTableProps) {
  const queryClient = useQueryClient();
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalQuantities, setApprovalQuantities] = useState<
    Record<string, number>
  >({});
  const [deletedItems, setDeletedItems] = useState<Set<string>>(new Set());

  // Fetch requests using React Query so we can invalidate on WebSocket events
  const { data: requests = initialRequests || [], isLoading } = useQuery({
    queryKey: [`${type}-requests`],
    queryFn: async () => {
      const response = await axios.get(`/api/requests/${type}`);
      return response.data;
    },
    initialData: initialRequests, // Use server-side data as initial data
    staleTime: 0, // Always consider stale to allow refetching
  });

  // Subscribe to real-time updates for requests
  useRealtimeUpdates({
    events: [
      WebSocketEvents.REQUEST_CREATED,
      WebSocketEvents.REQUEST_APPROVED,
      WebSocketEvents.REQUEST_DENIED,
      WebSocketEvents.STOCK_UPDATED,
    ],
    queryKeys: [`${type}-requests`], // Match the query key
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      requestId,
      items,
    }: {
      requestId: string;
      items: any[];
    }) => {
      const response = await axios.patch(`/api/requests/${type}/${requestId}`, {
        requestId,
        approved: true,
        items: items,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Request approved');
      queryClient.invalidateQueries({ queryKey: [`${type}-requests`] });
      setApprovalDialogOpen(false);
      setSelectedRequest(null);
      setApprovalQuantities({});
      setDeletedItems(new Set());
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    },
  });

  const handleApproveClick = (request: any) => {
    const requestData = request.request as any;
    let items: any[] = [];

    if (requestData.items && Array.isArray(requestData.items)) {
      items = requestData.items;
    } else {
      items = [
        { bookTitle: requestData.bookTitle, quantity: requestData.quantity },
      ];
    }

    // Initialize approval quantities with requested quantities
    const initialQuantities: Record<string, number> = {};
    items.forEach((item: any) => {
      initialQuantities[item.bookTitle] = item.quantity;
    });

    setSelectedRequest(request);
    setApprovalQuantities(initialQuantities);
    setDeletedItems(new Set()); // Reset deleted items when opening dialog
    setApprovalDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedRequest) return;

    const requestData = selectedRequest.request as any;
    let items: any[] = [];

    if (requestData.items && Array.isArray(requestData.items)) {
      // Filter out deleted items and items with quantity 0, and update quantities
      items = requestData.items
        .filter((item: any) => !deletedItems.has(item.bookTitle))
        .map((item: any) => ({
          ...item,
          quantity: approvalQuantities[item.bookTitle] || item.quantity,
        }))
        .filter((item: any) => item.quantity > 0); // Remove items with 0 quantity
    } else {
      // Single item format
      if (!deletedItems.has(requestData.bookTitle)) {
        const quantity = approvalQuantities[requestData.bookTitle] || requestData.quantity;
        if (quantity > 0) {
          items = [
            {
              bookTitle: requestData.bookTitle,
              quantity: quantity,
            },
          ];
        }
      }
    }

    // Ensure at least one item is being approved
    if (items.length === 0) {
      toast.error('Please approve at least one item');
      return;
    }

    approveMutation.mutate({
      requestId: selectedRequest.id,
      items: items,
    });
  };

  const updateApprovalQuantity = (
    bookTitle: string,
    delta: number,
    available: number
  ) => {
    setApprovalQuantities((prev) => {
      const current = prev[bookTitle] || 0;
      const newQuantity = Math.max(0, Math.min(available, current + delta));
      return { ...prev, [bookTitle]: newQuantity };
    });
  };

  const denyMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axios.patch(`/api/requests/${type}/${requestId}`, {
        requestId,
        approved: false,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Request denied');
      queryClient.invalidateQueries({ queryKey: [`${type}-requests`] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deny request');
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'request',
      header: 'Request Details',
      cell: ({ row }) => {
        const request = row.original.request as any;
        // For mini-store requests, show table ID; for main-store requests, show mini store info
        const tableId = row.original.tableSaleSession?.tableId || null;
        const tableName = row.original.tableSaleSession?.name || null;
        const miniStoreId = row.original.miniStoreSession?.id || null;

        // Handle new format with multiple items
        if (request.items && Array.isArray(request.items)) {
          return (
            <div className='space-y-2'>
              {type === 'mini-store' && tableId && (
                <div className='text-sm'>
                  <span className='text-gray-500'>Table ID: </span>
                  <span className='font-bold'>{tableId}</span>
                  {tableName && tableName !== tableId && (
                    <span className='text-gray-500 ml-1'>({tableName})</span>
                  )}
                </div>
              )}
              {type === 'main-store' && miniStoreId && (
                <div className='text-sm'>
                  <span className='text-gray-500'>Mini Store: </span>
                  <span className='font-bold'>{miniStoreId}</span>
                </div>
              )}
              <div className='text-sm'>
                <span className='text-gray-500'>Requested by: </span>
                <span>{request.requestedBy}</span>
              </div>
              <div className='text-sm font-medium'>
                {request.totalItems} item{request.totalItems > 1 ? 's' : ''} •
                Total: {request.totalQuantity} units
              </div>
              <div className='space-y-1'>
                {request.items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className='text-sm border-l-2 border-gray-200 pl-2'
                  >
                    <span className='font-medium'>{item.bookTitle}</span>
                    <span className='text-gray-500 ml-2'>
                      × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Fallback for old format (single item)
        return (
          <div className='space-y-2'>
            {type === 'mini-store' && tableId && (
              <div className='text-sm'>
                <span className='text-gray-500'>Table ID: </span>
                <span className='font-bold'>{tableId}</span>
                {tableName && tableName !== tableId && (
                  <span className='text-gray-500 ml-1'>({tableName})</span>
                )}
              </div>
            )}
            {type === 'main-store' && miniStoreId && (
              <div className='text-sm'>
                <span className='text-gray-500'>Mini Store: </span>
                <span className='font-bold'>{miniStoreId}</span>
              </div>
            )}
            <div className='font-medium'>{request.bookTitle}</div>
            <div className='text-sm'>
              <span className='text-gray-500'>Quantity: </span>
              <span>{request.quantity}</span>
            </div>
            <div className='text-sm'>
              <span className='text-gray-500'>Requested by: </span>
              <span>{request.requestedBy}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Requested At',
      cell: ({ row }) => {
        return new Date(row.original.createdAt).toLocaleString();
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        if (row.original.wasApproved) {
          return (
            <Badge variant='default' className='bg-green-500'>
              Approved
            </Badge>
          );
        } else if (row.original.wasDenied) {
          return <Badge variant='destructive'>Denied</Badge>;
        } else {
          return <Badge variant='secondary'>Pending</Badge>;
        }
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.wasApproved || row.original.wasDenied) {
          return <span className='text-gray-500'>No actions</span>;
        }

        return (
          <div className='flex gap-2'>
            <Button
              size='sm'
              onClick={() => handleApproveClick(row.original)}
              disabled={approveMutation.isPending || denyMutation.isPending}
              className='bg-green-500 hover:bg-green-600'
            >
              Approve
            </Button>
            <Button
              size='sm'
              variant='destructive'
              onClick={() => denyMutation.mutate(row.original.id)}
              disabled={approveMutation.isPending || denyMutation.isPending}
            >
              Deny
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: requests || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <div className='rounded-md border p-8 text-center'>
        <div className='text-gray-500'>Loading requests...</div>
      </div>
    );
  }

  // Get items and available stock for approval dialog
  const getApprovalDialogData = () => {
    if (!selectedRequest) return { items: [], availableStock: {} };

    const requestData = selectedRequest.request as any;
    let items: any[] = [];

    if (requestData.items && Array.isArray(requestData.items)) {
      items = requestData.items;
    } else {
      items = [
        { bookTitle: requestData.bookTitle, quantity: requestData.quantity },
      ];
    }

    // Get available stock from the appropriate store session
    let storeStock: any[] = [];
    if (type === 'mini-store') {
      storeStock = (selectedRequest.miniStoreSession?.data as any)?.list || [];
    } else {
      storeStock = (selectedRequest.mainStoreSession?.data as any)?.list || [];
    }

    const availableStock: Record<string, number> = {};

    items.forEach((item: any) => {
      const bookStock = storeStock.find(
        (book: any) => book.title === item.bookTitle
      );
      availableStock[item.bookTitle] = bookStock?.available || 0;
    });

    return { items, availableStock };
  };

  const { items: approvalItems, availableStock } = getApprovalDialogData();
  const tableId = selectedRequest?.tableSaleSession?.tableId || null;
  const tableName = selectedRequest?.tableSaleSession?.name || null;
  const miniStoreId = selectedRequest?.miniStoreSession?.id || null;

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => {
                    const headerLabel =
                      typeof cell.column.columnDef.header === 'string'
                        ? cell.column.columnDef.header
                        : cell.column.id;
                    return (
                      <TableCell key={cell.id} data-label={headerLabel}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {requests && requests.length > 0 && (
        <div className='flex items-center justify-between space-x-2 py-4 px-4'>
          <div className='text-sm text-muted-foreground'>
            Showing{' '}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{' '}
            to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              requests.length
            )}{' '}
            of {requests.length} request{requests.length !== 1 ? 's' : ''}
          </div>
          <div className='flex items-center space-x-2'>
            <div className='text-sm text-muted-foreground'>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount() || 1}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Approval Confirmation Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className='max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden'>
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
            <DialogDescription>
              Review and adjust quantities before approving this request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className='space-y-4'>
              {/* Table ID or Mini Store Display */}
              {type === 'mini-store' && tableId && (
                <div className='p-3 bg-primary/10 rounded-lg border border-primary/20'>
                  <div className='text-sm'>
                    <span className='text-gray-600'>Table ID: </span>
                    <span className='font-bold text-lg'>{tableId}</span>
                    {tableName && tableName !== tableId && (
                      <span className='text-gray-500 ml-2'>({tableName})</span>
                    )}
                  </div>
                  <div className='text-sm text-gray-600 mt-1'>
                    Requested by:{' '}
                    {selectedRequest.request?.requestedBy || 'N/A'}
                  </div>
                </div>
              )}
              {type === 'main-store' && miniStoreId && (
                <div className='p-3 bg-primary/10 rounded-lg border border-primary/20'>
                  <div className='text-sm'>
                    <span className='text-gray-600'>Mini Store: </span>
                    <span className='font-bold text-lg'>{miniStoreId}</span>
                  </div>
                  <div className='text-sm text-gray-600 mt-1'>
                    Requested by:{' '}
                    {selectedRequest.request?.requestedBy || 'N/A'}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className='space-y-3'>
                <h3 className='font-semibold text-sm'>Items to Approve:</h3>
                {approvalItems
                  .filter((item: any) => !deletedItems.has(item.bookTitle))
                  .map((item: any, index: number) => {
                    const available = availableStock[item.bookTitle] || 0;
                    const approvedQty =
                      approvalQuantities[item.bookTitle] || item.quantity;
                    const requestedQty = item.quantity;

                    return (
                      <div
                        key={index}
                        className='p-3 border rounded-lg space-y-2'
                      >
                        <div className='flex justify-between items-start'>
                          <div className='flex-1'>
                            <div className='font-medium'>{item.bookTitle}</div>
                            <div className='text-sm text-gray-500'>
                              Requested: {requestedQty} • Available: {available}
                            </div>
                          </div>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => {
                              setDeletedItems((prev) => {
                                const newSet = new Set(prev);
                                newSet.add(item.bookTitle);
                                return newSet;
                              });
                              // Also set quantity to 0 when deleting
                              setApprovalQuantities((prev) => ({
                                ...prev,
                                [item.bookTitle]: 0,
                              }));
                            }}
                            className='h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                          >
                            <IconTrash className='h-4 w-4' />
                          </Button>
                        </div>
                      <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
                        <Label className='text-sm flex-shrink-0'>
                          Approve Quantity:
                        </Label>
                        <div className='flex items-center gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              updateApprovalQuantity(
                                item.bookTitle,
                                -1,
                                available
                              )
                            }
                            disabled={approvedQty <= 0}
                            className='h-8 w-8 p-0'
                          >
                            <IconMinus className='h-3 w-3' />
                          </Button>
                          <Input
                            type='number'
                            value={approvedQty}
                            onChange={(e) => {
                              const value = Math.max(
                                0,
                                Math.min(
                                  available,
                                  parseInt(e.target.value) || 0
                                )
                              );
                              setApprovalQuantities((prev) => ({
                                ...prev,
                                [item.bookTitle]: value,
                              }));
                            }}
                            min={0}
                            max={available}
                            className='w-20 h-8 text-center'
                          />
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              updateApprovalQuantity(
                                item.bookTitle,
                                1,
                                available
                              )
                            }
                            disabled={approvedQty >= available}
                            className='h-8 w-8 p-0'
                          >
                            <IconPlus className='h-3 w-3' />
                          </Button>
                        </div>
                        {approvedQty > available && (
                          <span className='text-xs text-red-500'>
                            Exceeds available stock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary of approved items */}
              {(() => {
                const requestData = selectedRequest.request as any;
                let originalItems: any[] = [];
                if (requestData.items && Array.isArray(requestData.items)) {
                  originalItems = requestData.items;
                } else {
                  originalItems = [
                    {
                      bookTitle: requestData.bookTitle,
                      quantity: requestData.quantity,
                    },
                  ];
                }

                const approvedItems = originalItems
                  .filter((item: any) => !deletedItems.has(item.bookTitle))
                  .map((item: any) => ({
                    ...item,
                    quantity: approvalQuantities[item.bookTitle] || item.quantity,
                  }))
                  .filter((item: any) => item.quantity > 0);

                const originalTotal = originalItems.reduce(
                  (sum: number, item: any) => sum + item.quantity,
                  0
                );
                const approvedTotal = approvedItems.reduce(
                  (sum: number, item: any) => sum + item.quantity,
                  0
                );

                return (
                  <div className='p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800'>
                    <h4 className='font-semibold text-sm mb-2'>Approval Summary:</h4>
                    <div className='text-sm space-y-1'>
                      <div>
                        <span className='text-gray-600'>Original Request: </span>
                        <span className='font-medium'>
                          {originalItems.length} item{originalItems.length !== 1 ? 's' : ''} • {originalTotal} unit{originalTotal !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-600'>Will Approve: </span>
                        <span className='font-medium text-green-700 dark:text-green-400'>
                          {approvedItems.length} item{approvedItems.length !== 1 ? 's' : ''} • {approvedTotal} unit{approvedTotal !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {approvedItems.length < originalItems.length && (
                        <div className='text-xs text-orange-600 dark:text-orange-400 mt-1'>
                          {originalItems.length - approvedItems.length} item{originalItems.length - approvedItems.length !== 1 ? 's' : ''} removed from approval
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setApprovalDialogOpen(false);
                setSelectedRequest(null);
                setApprovalQuantities({});
                setDeletedItems(new Set());
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={approveMutation.isPending}
              className='bg-green-500 hover:bg-green-600'
            >
              {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
