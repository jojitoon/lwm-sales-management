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
import { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { IconPlus, IconMinus, IconTrash } from '@tabler/icons-react';

interface RequestBookFromMainProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface RequestItem {
  bookTitle: string;
  quantity: number;
}

export function RequestBookFromMain({
  open,
  setOpen,
}: RequestBookFromMainProps) {
  const [selectedBook, setSelectedBook] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);

  const mutation = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await axios.post(
        '/api/requests/main-store',
        requestData
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Request sent successfully');
      setOpen(false);
      setSelectedBook('');
      setQuantity(1);
      setRequestItems([]);
      // Reload the page to ensure fresh data
      window.location.reload();
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.response?.data?.message || 'Failed to send request');
    },
  });

  useEffect(() => {
    if (open) {
      // Fetch available books from main store
      axios
        .get('/api/books/main-store-stock')
        .then((response) => {
          setAvailableBooks(response.data);
        })
        .catch((error) => {
          console.error('Failed to fetch main store stock:', error);
        });
    }
  }, [open]);

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

  const handleSave = () => {
    if (requestItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    mutation.mutate({
      items: requestItems,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Request Books from Main Store</DialogTitle>
          <DialogDescription>
            Request multiple books from the main store for your mini store.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Add Items Section */}
          <div className='space-y-4 p-4 border rounded-lg'>
            <h3 className='text-lg font-semibold'>Add Books to Request</h3>
            <div className='flex gap-4'>
              <div className='flex-1'>
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
                            <span>{book.title}</span>
                            <span className='text-sm text-gray-500 ml-2'>
                              Available: {book.available}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className='w-24'>
                <Label>Quantity</Label>
                <Input
                  type='number'
                  min='1'
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className='mt-1'
                />
              </div>
              <div className='flex items-end'>
                <Button onClick={addItem} className='gap-2'>
                  <IconPlus className='h-4 w-4' />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Request Items */}
          {requestItems.length > 0 && (
            <div className='space-y-4 p-4 border rounded-lg'>
              <h3 className='text-lg font-semibold'>
                Request Items ({requestItems.length})
              </h3>
              <div className='space-y-3'>
                {requestItems.map((item, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 border rounded-lg bg-card'
                  >
                    <div className='flex-1'>
                      <h4 className='font-semibold'>{item.bookTitle}</h4>
                      <p className='text-sm text-gray-600'>
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            updateItemQuantity(index, item.quantity - 1)
                          }
                          className='h-8 w-8 p-0'
                        >
                          <IconMinus className='h-3 w-3' />
                        </Button>
                        <span className='font-medium min-w-[2rem] text-center'>
                          {item.quantity}
                        </span>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            updateItemQuantity(index, item.quantity + 1)
                          }
                          className='h-8 w-8 p-0'
                        >
                          <IconPlus className='h-3 w-3' />
                        </Button>
                      </div>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => removeItem(index)}
                        className='h-8 w-8 p-0'
                      >
                        <IconTrash className='h-3 w-3' />
                      </Button>
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
    </Dialog>
  );
}
