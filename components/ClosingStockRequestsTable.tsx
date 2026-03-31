'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WebSocketEvents } from '@/lib/websocket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function getItemsList(req: any) {
  const items = req?.items as any;
  const list = items?.list;
  return Array.isArray(list) ? list : [];
}

export function ClosingStockRequestsTable({ initialRequests }: { initialRequests?: any[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [matched, setMatched] = useState<Record<string, boolean>>({});

  const { data: requests = initialRequests || [], isLoading } = useQuery({
    queryKey: ['closing-requests'],
    queryFn: async () => {
      const res = await axios.get('/api/closing-requests');
      return res.data;
    },
    initialData: initialRequests,
    staleTime: 0,
  });

  useRealtimeUpdates({
    events: [
      WebSocketEvents.REQUEST_CREATED,
      WebSocketEvents.REQUEST_APPROVED,
      WebSocketEvents.REQUEST_DENIED,
    ],
    queryKeys: ['closing-requests'],
  });

  const pendingCount = useMemo(
    () => (requests || []).filter((r: any) => r.status === 'PENDING').length,
    [requests],
  );

  const verifyMutation = useMutation({
    mutationFn: async (payload: { id: string; action: 'verify' | 'deny'; verification?: any }) => {
      const res = await axios.patch(`/api/closing-requests/${payload.id}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Updated');
      queryClient.invalidateQueries({ queryKey: ['closing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['table-stock'] });
      queryClient.invalidateQueries({ queryKey: ['mini-store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['main-store-stock'] });
      setOpen(false);
      setSelected(null);
      setMatched({});
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed');
    },
  });

  const openVerify = (req: any) => {
    setSelected(req);
    const list = getItemsList(req);
    const init: Record<string, boolean> = {};
    list.forEach((i: any) => {
      init[String(i.title)] = false;
    });
    setMatched(init);
    setOpen(true);
  };

  const list = selected ? getItemsList(selected) : [];
  const allMatched = list.length === 0 ? true : list.every((i: any) => matched[String(i.title)]);

  if (isLoading) {
    return (
      <div className='rounded-md border p-8 text-center'>
        <div className='text-gray-500'>Loading closing requests…</div>
      </div>
    );
  }

  return (
    <>
      <div className='flex items-center justify-between mb-4'>
        <div className='text-sm text-muted-foreground'>
          Pending: <span className='font-medium text-foreground'>{pendingCount}</span>
        </div>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flow</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests?.length ? (
              requests.map((r: any) => {
                const items = r.items as any;
                const from =
                  r.fromWorkspace === 'table-manager'
                    ? `Table ${r.fromTableSaleSession?.tableId || ''}`.trim()
                    : `Mini Store ${r.fromMiniStoreSession?.id || ''}`.trim();
                const to =
                  r.toWorkspace === 'mini-store'
                    ? `Mini Store ${r.toMiniStoreSession?.id || ''}`.trim()
                    : `Main Store ${r.toMainStoreSession?.name || r.toMainStoreSession?.id || ''}`.trim();
                const totalItems = items?.totalItems ?? getItemsList(r).length;
                const totalQuantity = items?.totalQuantity ?? 0;

                return (
                  <TableRow key={r.id}>
                    <TableCell className='font-medium'>
                      {from} → {to}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {totalItems} item{totalItems === 1 ? '' : 's'} • {totalQuantity} units
                    </TableCell>
                    <TableCell>
                      {r.status === 'PENDING' ? (
                        <Badge variant='secondary'>Pending</Badge>
                      ) : r.status === 'VERIFIED' ? (
                        <Badge className='bg-green-500'>Verified</Badge>
                      ) : (
                        <Badge variant='destructive'>Denied</Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {r.status === 'PENDING' ? (
                        <Button size='sm' onClick={() => openVerify(r)}>
                          Verify
                        </Button>
                      ) : (
                        <span className='text-gray-500 text-sm'>—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  No closing requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Verify closing stock</DialogTitle>
            <DialogDescription>
              Tick each item after physically confirming the quantity returned. Once all items match,
              you can verify and close.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className='space-y-3'>
              {list.length === 0 ? (
                <div className='text-sm text-muted-foreground'>
                  No remaining stock to return. You can verify to close the session.
                </div>
              ) : (
                <div className='space-y-2'>
                  {list.map((i: any) => {
                    const key = String(i.title);
                    return (
                      <div key={key} className='flex items-start justify-between gap-3 border rounded-md p-3'>
                        <div>
                          <div className='font-medium'>{i.title}</div>
                          <div className='text-sm text-muted-foreground'>Qty: {i.quantity}</div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Checkbox
                            checked={!!matched[key]}
                            onCheckedChange={(v) =>
                              setMatched((prev) => ({ ...prev, [key]: Boolean(v) }))
                            }
                          />
                          <span className='text-sm'>Matches</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setOpen(false);
                setSelected(null);
                setMatched({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => verifyMutation.mutate({ id: selected.id, action: 'deny' })}
              disabled={verifyMutation.isPending}
            >
              Deny
            </Button>
            <Button
              onClick={() =>
                verifyMutation.mutate({
                  id: selected.id,
                  action: 'verify',
                  verification: { matched },
                })
              }
              disabled={verifyMutation.isPending || !allMatched}
              className='bg-green-600 hover:bg-green-700'
            >
              {verifyMutation.isPending ? 'Verifying…' : 'Verify & Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

