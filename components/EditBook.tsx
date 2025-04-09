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
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from './ui/label';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { revalidateBooks } from '@/lib/actions/books';
import { Book } from '@/prisma/generated/client';

export default function EditBook({
  open,
  setOpen,
  book,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  book: Book;
}) {
  const [price, setPrice] = useState(book?.price);
  const [quantity, setQuantity] = useState(book?.total);

  useEffect(() => {
    setPrice(book?.price);
    setQuantity(book?.total);
  }, [book]);

  const mutation = useMutation({
    mutationFn: async ({
      price,
      quantity,
    }: {
      price: number;
      quantity: number;
    }) => {
      const response = await axios.patch('/api/books', {
        id: book.id,
        title: book.title,
        price,
        quantity,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Book updated successfully');
      await revalidateBooks();
      setOpen(false);
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.response.data.message);
    },
  });

  const handleSave = () => {
    if (price <= 0 || quantity <= 0) {
      toast.error('Please enter a valid price and quantity');
      return;
    }

    mutation.mutate({
      price,
      quantity,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit - {book?.title}</DialogTitle>
          <DialogDescription>
            Edit book details in the database.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label>Price (₦)</Label>
            <Input
              type='number'
              placeholder='Price'
              value={price || ''}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Quantity</Label>
            <Input
              type='number'
              placeholder='Quantity'
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
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
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
