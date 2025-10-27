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

interface RequestBookFromMiniProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function RequestBookFromMini({
  open,
  setOpen,
}: RequestBookFromMiniProps) {
  const [selectedBook, setSelectedBook] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);

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
      setSelectedBook('');
      setQuantity(1);
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.response?.data?.message || 'Failed to send request');
    },
  });

  const handleSave = () => {
    if (!selectedBook || quantity <= 0) {
      toast.error('Please select a book and enter a valid quantity');
      return;
    }

    mutation.mutate({
      bookTitle: selectedBook,
      quantity,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Books from Mini Store</DialogTitle>
          <DialogDescription>
            Request books from the mini store for your table.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label>Book Title</Label>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select a book' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Books</SelectLabel>
                  {availableBooks?.map((book, index) => (
                    <SelectItem key={index} value={book.title}>
                      {book.title} (Available: {book.available})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Quantity</Label>
            <Input
              type='number'
              min='1'
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder='Enter quantity'
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            onClick={handleSave}
            disabled={mutation.isPending}
            className='cursor-pointer'
          >
            {mutation.isPending ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
