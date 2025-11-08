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
import { Checkbox } from './ui/checkbox';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useBooks } from '@/hooks/data/useBooks';
import { revalidateBooks } from '@/lib/actions/books';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export default function AddBook({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { data: books, refetch, isLoading: booksLoading } = useBooks();
  const [book, setBook] = useState('');
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [customTitle, setCustomTitle] = useState('');
  const [isCombo, setIsCombo] = useState(false);
  const [comboItems, setComboItems] = useState<
    Array<{ componentBookId: string; quantity: number }>
  >([]);

  const mutation = useMutation({
    mutationFn: async ({
      title,
      price,
      quantity,
      isCombo,
      comboItems,
    }: {
      title: string;
      price: number;
      quantity: number;
      isCombo: boolean;
      comboItems?: Array<{ componentBookId: string; quantity: number }>;
    }) => {
      const response = await axios.post('/api/books', {
        title,
        price,
        quantity,
        isCombo,
        comboItems: isCombo ? comboItems : undefined,
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
      setIsCombo(false);
      setComboItems([]);
      await revalidateBooks();
      setOpen(false);
      // Reload the page to ensure fresh data
      window.location.reload();
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.response?.data?.message || 'Failed to create book');
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
    if (price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!isCombo && quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (isCombo && comboItems.length === 0) {
      toast.error('Please add at least one component book to the combo');
      return;
    }

    const data = {
      title: book === 'custom' ? customTitle : book,
      price,
      quantity: isCombo ? 0 : quantity,
      isCombo,
      comboItems: isCombo ? comboItems : undefined,
    };
    mutation.mutate(data);
  };

  const addComboItem = () => {
    setComboItems([...comboItems, { componentBookId: '', quantity: 1 }]);
  };

  const removeComboItem = (index: number) => {
    setComboItems(comboItems.filter((_, i) => i !== index));
  };

  const updateComboItem = (
    index: number,
    field: 'componentBookId' | 'quantity',
    value: string | number
  ) => {
    const updated = [...comboItems];
    updated[index] = { ...updated[index], [field]: value };
    setComboItems(updated);
  };

  // Get available books for combo items - show all books that are NOT combo books
  const availableComponentBooks = useMemo(() => {
    if (!books || !Array.isArray(books)) {
      console.log('Books data:', books);
      return [];
    }

    // Simply filter out combo books - show all other books
    const filtered = books.filter((b: any) => {
      // Exclude combo books only (isCombo === true)
      // Treat undefined/null as false (regular book)
      return b.isCombo !== true;
    });

    console.log('Available component books:', filtered.length, filtered);
    return filtered;
  }, [books]);

  console.log({ availableComponentBooks, books });

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
          <div className='flex items-center gap-2'>
            <Checkbox
              id='isCombo'
              checked={isCombo}
              onCheckedChange={(checked) => {
                setIsCombo(checked === true);
                if (checked) {
                  setQuantity(0);
                }
              }}
            />
            <Label htmlFor='isCombo' className='cursor-pointer'>
              This is a combo book (no own quantity, links to other books)
            </Label>
          </div>
          {!isCombo && (
            <div className='flex flex-col gap-2'>
              <Label>Quantity</Label>
              <Input
                type='number'
                placeholder='Quantity'
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          )}
          {isCombo && (
            <div className='flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <Label>Component Books</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addComboItem}
                >
                  <IconPlus className='h-4 w-4 mr-2' />
                  Add Component
                </Button>
              </div>
              {comboItems.map((item, index) => (
                <div key={index} className='flex gap-2 items-end'>
                  <div className='flex-1 flex flex-col gap-2'>
                    <Label>Book</Label>
                    <Select
                      value={item.componentBookId}
                      onValueChange={(value) =>
                        updateComboItem(index, 'componentBookId', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select a book' />
                      </SelectTrigger>
                      <SelectContent>
                        {booksLoading ? (
                          <SelectItem value='loading' disabled>
                            Loading books...
                          </SelectItem>
                        ) : availableComponentBooks.length === 0 ? (
                          <SelectItem value='no-books' disabled>
                            No books available
                          </SelectItem>
                        ) : (
                          availableComponentBooks.map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='w-24 flex flex-col gap-2'>
                    <Label>Qty</Label>
                    <Input
                      type='number'
                      min='1'
                      value={item.quantity}
                      onChange={(e) =>
                        updateComboItem(
                          index,
                          'quantity',
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => removeComboItem(index)}
                  >
                    <IconTrash className='h-4 w-4' />
                  </Button>
                </div>
              ))}
              {comboItems.length === 0 && (
                <p className='text-sm text-muted-foreground'>
                  No component books added. Click "Add Component" to add books
                  to this combo.
                </p>
              )}
              {booksLoading && (
                <p className='text-sm text-muted-foreground'>
                  Loading books...
                </p>
              )}
              {!booksLoading &&
                availableComponentBooks.length === 0 &&
                books &&
                books.length > 0 && (
                  <p className='text-sm text-yellow-600'>
                    No non-combo books found. All books in the database are
                    combo books.
                  </p>
                )}
              {!booksLoading && (!books || books.length === 0) && (
                <p className='text-sm text-yellow-600'>
                  No books found in the database. Please create some books
                  first.
                </p>
              )}
            </div>
          )}
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
