'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DialogHeader } from './ui/dialog';
import { Button } from './ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WebSocketEvents } from '@/lib/websocket';
import {
  IconPlus,
  IconMinus,
  IconTrash,
  IconChecklist,
} from '@tabler/icons-react';

interface RequestBookFromMiniProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface RequestItem {
  bookTitle: string;
  quantity: number;
}

export function RequestBookFromMini({
  open,
  setOpen,
}: RequestBookFromMiniProps) {
  const [selectedBook, setSelectedBook] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);
  const [allBooksQuantity, setAllBooksQuantity] = useState(1);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Subscribe to real-time updates for requests and stock
  useRealtimeUpdates({
    events: [
      WebSocketEvents.REQUEST_CREATED,
      WebSocketEvents.REQUEST_APPROVED,
      WebSocketEvents.STOCK_UPDATED,
    ],
    queryKeys: ['mini-store-requests', 'mini-store-stock'],
  });

  useEffect(() => {
    if (open) {
      // Fetch available books from mini store
      axios
        .get('/api/books/mini-store-stock')
        .then((response) => {
          setAvailableBooks(response.data);
        })
        .catch((error) => {
          console.error('Failed to fetch mini store stock:', error);
        });
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await axios.post(
        '/api/requests/mini-store',
        requestData
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Request sent successfully');
      setOpen(false);
      setConfirmDialogOpen(false);
      setSelectedBook('');
      setQuantity(1);
      setRequestItems([]);
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.response?.data?.message || 'Failed to send request');
    },
  });

  const addItem = () => {
    if (!selectedBook || quantity <= 0) {
      toast.error('Please select a book and enter a valid quantity');
      return;
    }

    const book = availableBooks.find((b) => b.title === selectedBook);
    if (!book) {
      toast.error('Book not found');
      return;
    }

    if (quantity > book.available) {
      toast.error('Insufficient stock');
      return;
    }

    // Check if book already exists in request items
    const existingItemIndex = requestItems.findIndex(
      (item) => item.bookTitle === selectedBook
    );

    if (existingItemIndex !== -1) {
      // Book already exists, update quantity
      const existingItem = requestItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > book.available) {
        toast.error(
          `Insufficient stock. Available: ${book.available}, Requested: ${newQuantity}`
        );
        return;
      }

      const updatedItems = [...requestItems];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
      };
      setRequestItems(updatedItems);
      toast.success(`Updated quantity for "${selectedBook}" to ${newQuantity}`);
    } else {
      // New book, add to request items
      setRequestItems([...requestItems, { bookTitle: selectedBook, quantity }]);
      toast.success(`Added "${selectedBook}" to request`);
    }

    setSelectedBook('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    const item = requestItems[index];
    const book = availableBooks.find((b) => b.title === item.bookTitle);

    if (book && newQuantity > book.available) {
      toast.error(`Insufficient stock. Available: ${book.available}`);
      return;
    }

    const updatedItems = [...requestItems];
    updatedItems[index] = { ...item, quantity: newQuantity };
    setRequestItems(updatedItems);
  };

  const addAllBooks = () => {
    if (allBooksQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (availableBooks.length === 0) {
      toast.error('No books available');
      return;
    }

    const newItems: RequestItem[] = [];
    let addedCount = 0;
    let skippedCount = 0;

    availableBooks.forEach((book) => {
      if (book.available > 0) {
        const requestQuantity = Math.min(allBooksQuantity, book.available);

        // Check if book already exists in request items
        const existingItemIndex = requestItems.findIndex(
          (item) => item.bookTitle === book.title
        );

        if (existingItemIndex !== -1) {
          // Book already exists, update quantity
          const existingItem = requestItems[existingItemIndex];
          const newQuantity = Math.min(
            existingItem.quantity + requestQuantity,
            book.available
          );
          newItems.push({
            bookTitle: book.title,
            quantity: newQuantity,
          });
        } else {
          // New book, add to request items
          newItems.push({
            bookTitle: book.title,
            quantity: requestQuantity,
          });
        }
        addedCount++;
      } else {
        skippedCount++;
      }
    });

    // Merge with existing items that weren't in availableBooks
    const existingItemsNotInAvailable = requestItems.filter(
      (item) => !availableBooks.some((book) => book.title === item.bookTitle)
    );

    setRequestItems([...existingItemsNotInAvailable, ...newItems]);

    if (addedCount > 0) {
      toast.success(
        `Added ${addedCount} book${addedCount > 1 ? 's' : ''} to request${
          skippedCount > 0 ? ` (${skippedCount} skipped - no stock)` : ''
        }`
      );
    } else {
      toast.error('No books with available stock to add');
    }
  };

  const handleSave = () => {
    if (requestItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirmSend = () => {
    mutation.mutate({
      items: requestItems,
    });
    setConfirmDialogOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden'>
        <DialogHeader>
          <DialogTitle>Request Books from Mini Store</DialogTitle>
          <DialogDescription>
            Request multiple books from the mini store for your table.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          <Tabs defaultValue='individual' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='individual'>Add Individual Books</TabsTrigger>
              <TabsTrigger value='all'>Add All Books</TabsTrigger>
            </TabsList>

            <TabsContent value='individual' className='space-y-4 mt-4'>
              <div className='space-y-4 p-3 sm:p-4 border rounded-lg'>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
                  <div className='flex-1 w-full'>
                    <Label>Book Title</Label>
                    <Select value={selectedBook} onValueChange={setSelectedBook}>
                      <SelectTrigger className='w-full mt-1'>
                        <SelectValue placeholder='Select a book' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Available Books</SelectLabel>
                          {availableBooks?.map((book, index) => (
                            <SelectItem key={index} value={book.title}>
                              <div className='flex justify-between w-full'>
                                <span className='truncate'>{book.title}</span>
                                <span className='text-sm text-gray-500 ml-2 flex-shrink-0'>
                                  Available: {book.available}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='w-full sm:w-24'>
                    <Label>Quantity</Label>
                    <Input
                      type='number'
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className='mt-1 w-full'
                    />
                  </div>
                  <div className='flex items-end w-full sm:w-auto'>
                    <Button onClick={addItem} className='gap-2 w-full sm:w-auto'>
                      <IconPlus className='h-4 w-4' />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value='all' className='space-y-4 mt-4'>
              <div className='space-y-4 p-3 sm:p-4 border rounded-lg bg-blue-50 dark:bg-blue-950'>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end'>
                  <div className='flex-1 w-full'>
                    <Label>Quantity for All Available Books</Label>
                    <Input
                      type='number'
                      value={allBooksQuantity}
                      onChange={(e) => setAllBooksQuantity(Number(e.target.value))}
                      className='mt-1 w-full'
                      placeholder='Enter quantity'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      This will add all available books with the specified quantity
                      (or available stock if less)
                    </p>
                  </div>
                  <div className='flex items-end w-full sm:w-auto'>
                    <Button
                      onClick={addAllBooks}
                      className='gap-2 w-full sm:w-auto'
                      variant='secondary'
                      disabled={availableBooks.length === 0}
                    >
                      <IconChecklist className='h-4 w-4' />
                      Add All Books
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Request Items */}
          {requestItems.length > 0 && (
            <div className='space-y-4 p-3 sm:p-4 border rounded-lg'>
              <h3 className='text-base sm:text-lg font-semibold'>
                Request Items ({requestItems.length})
              </h3>
              <div className='space-y-2 sm:space-y-3'>
                {requestItems.map((item, index) => (
                  <div
                    key={index}
                    className='overflow-hidden rounded-lg border bg-card shadow-sm'
                  >
                    {/* Mobile Compact View */}
                    <div className='sm:hidden flex flex-col'>
                      <div className='flex items-center justify-between p-2 border-b border-border/50'>
                        <span className='text-xs font-medium text-foreground break-words flex-1 pr-2'>
                          {item.bookTitle}
                        </span>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => removeItem(index)}
                          className='h-6 w-6 p-0 flex-shrink-0'
                        >
                          <IconTrash className='h-3 w-3' />
                        </Button>
                      </div>
                      <div className='flex items-center justify-between p-2'>
                        <span className='text-xs text-muted-foreground'>Quantity:</span>
                        <div className='flex items-center gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              updateItemQuantity(index, item.quantity - 1)
                            }
                            className='h-6 w-6 p-0'
                          >
                            <IconMinus className='h-3 w-3' />
                          </Button>
                          <span className='font-medium min-w-[2rem] text-center text-xs'>
                            {item.quantity}
                          </span>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              updateItemQuantity(index, item.quantity + 1)
                            }
                            className='h-6 w-6 p-0'
                          >
                            <IconPlus className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop View */}
                    <div className='hidden sm:block'>
                      {/* Book Title Row */}
                      <div className='flex flex-row w-full'>
                        <div className='flex items-center bg-primary min-w-[100px] flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 border-r border-border'>
                          <span className='font-semibold text-primary-foreground text-xs sm:text-sm'>
                            Book Title
                          </span>
                        </div>
                        <div className='flex-1 px-3 py-2 sm:px-4 sm:py-3'>
                          <span className='text-xs sm:text-sm font-medium text-foreground break-words'>
                            {item.bookTitle}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Row */}
                      <div className='flex flex-row w-full border-t border-border/50'>
                        <div className='flex items-center bg-primary min-w-[100px] flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 border-r border-border'>
                          <span className='font-semibold text-primary-foreground text-xs sm:text-sm'>
                            Quantity
                          </span>
                        </div>
                        <div className='flex-1 px-3 py-2 sm:px-4 sm:py-3'>
                          <div className='flex items-center gap-2 sm:gap-3'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                updateItemQuantity(index, item.quantity - 1)
                              }
                              className='h-7 w-7 p-0 sm:h-8 sm:w-8'
                            >
                              <IconMinus className='h-3 w-3' />
                            </Button>
                            <span className='font-medium min-w-[2rem] text-center text-xs sm:text-sm'>
                              {item.quantity}
                            </span>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                updateItemQuantity(index, item.quantity + 1)
                              }
                              className='h-7 w-7 p-0 sm:h-8 sm:w-8'
                            >
                              <IconPlus className='h-3 w-3' />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className='flex flex-row w-full border-t border-border/50'>
                        <div className='flex items-center bg-primary min-w-[100px] flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 border-r border-border'>
                          <span className='font-semibold text-primary-foreground text-xs sm:text-sm'>
                            Actions
                          </span>
                        </div>
                        <div className='flex-1 px-3 py-2 sm:px-4 sm:py-3'>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => removeItem(index)}
                            className='h-7 px-3 text-xs sm:h-8 sm:px-4 sm:text-sm w-full sm:w-auto'
                          >
                            <IconTrash className='h-3 w-3 mr-1 sm:mr-2' />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type='button'
            onClick={handleSave}
            disabled={mutation.isPending || requestItems.length === 0}
            className='w-full'
          >
            {mutation.isPending ? 'Sending Request...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className='max-w-[calc(100vw-1rem)] sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirm Request</DialogTitle>
            <DialogDescription>
              Please review your request before sending.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <p className='text-sm font-medium'>
                Total Items: {requestItems.length}
              </p>
              <p className='text-sm font-medium'>
                Total Quantity:{' '}
                {requestItems.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>

            <div className='max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-3'>
              {requestItems.map((item, index) => (
                <div
                  key={index}
                  className='flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0'
                >
                  <span className='flex-1 truncate pr-2'>{item.bookTitle}</span>
                  <span className='font-medium'>× {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setConfirmDialogOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={mutation.isPending}
              className='w-full sm:w-auto'
            >
              {mutation.isPending ? 'Sending...' : 'Confirm & Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
