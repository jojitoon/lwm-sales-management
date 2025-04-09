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
import { Input } from '@/components/ui/input';
import { Label } from './ui/label';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useBooks } from '@/hooks/data/useBooks';
import { revalidateBooks } from '@/lib/actions/books';

export default function AddBook({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { data: books, refetch } = useBooks();
  const [book, setBook] = useState('');
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [customTitle, setCustomTitle] = useState('');

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
      toast.success('Book created successfully');
      refetch();
      setBook('');
      setPrice(0);
      setQuantity(0);
      setCustomTitle('');
      await revalidateBooks();
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
    if (!book) {
      toast.error('Please select a book title');
      return;
    }
    if (book === 'custom' && !customTitle) {
      toast.error('Please enter a custom title');
      return;
    }
    if (price <= 0 || quantity <= 0) {
      toast.error('Please enter a valid price and quantity');
      return;
    }

    // const exist = existingBooks?.some((existingBook) =>
    //   areStringsCloselyCorrectWords(existingBook, book)
    // );

    // if (exist) {
    //   toast.error('Book already exists');
    //   return;
    // }

    const data = {
      title: book === 'custom' ? customTitle : book,
      price,
      quantity,
    };
    mutation.mutate(data);
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
                setBook(value);
              }}
              value={book}
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
          {book === 'custom' && (
            <div className='flex flex-col gap-2'>
              <Label>Custom Book Title</Label>
              <Input
                type='text'
                placeholder='Book Title'
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
          )}
          <div className='flex flex-col gap-2'>
            <Label>Price (₦)</Label>
            <Input
              type='number'
              placeholder='Price'
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Quantity</Label>
            <Input
              type='number'
              placeholder='Quantity'
              value={quantity}
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
