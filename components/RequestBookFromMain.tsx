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
import { useMemo, useState } from 'react';
import { BOOKS } from '@/lib/constant/books';
import { Label } from './ui/label';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useBooks } from '@/hooks/data/useBooks';

const DEFAULT_QUANTITY = 30;

export default function RequestBookFromMain({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { data: books, refetch } = useBooks();
  const [requestedBooks, setRequestedBooks] = useState<any[]>([]);
  const [bookStock, setBookStock] = useState({});

  const mutation = useMutation({
    mutationFn: async ({
      title,
      price,
      quantity,
    }: {
      title: string;
      price: number;
      quantity: number;
    }) => {
      const response = await axios.post('/api/books', {
        title,
        price,
        quantity,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Books requested successfully');
      // await revalidateBooks();
      setOpen(false);
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.response.data.message);
    },
  });

  const existingBooks: string[] = useMemo(() => {
    return books?.map((book: any) => book.title as string);
  }, [books]);

  const handleSave = () => {
    if (requestedBooks.length === 0) {
      toast.error('Please select at least one book');
      return;
    }

    // mutation.mutate(data);
  };

  const availableBooks = useMemo(() => {
    return BOOKS.filter((book) => {
      return !existingBooks?.some((existingBook) => existingBook === book);
    });
  }, [existingBooks]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Book for sale</DialogTitle>
          <DialogDescription>
            Add a book for sale to the database.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label>Book Title</Label>
            <Select
              name='book'
              onValueChange={(value) => {
                setBookStock(value);
              }}
              value={bookStock}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select a book' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Books</SelectLabel>
                  <SelectItem value='custom'>Old Book</SelectItem>
                  {availableBooks?.map((book, index) => (
                    <SelectItem key={index} value={book}>
                      {book}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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
