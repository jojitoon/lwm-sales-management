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
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from './ui/label';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { revalidateBooks } from '@/lib/actions/books';
import { Book } from '@/prisma/generated/client';

export default function EditBookQuantity({
  open,
  setOpen,
  book,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  book: Book;
}) {
  const [quantity, setQuantity] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({ quantity }: { quantity: number }) => {
      const response = await axios.patch('/api/books/quantity', {
        id: book.id,
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
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    mutation.mutate({
      quantity,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Increase Stock - {book?.title}</DialogTitle>
          <DialogDescription>
            Increase the quantity of the book in the database.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
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
