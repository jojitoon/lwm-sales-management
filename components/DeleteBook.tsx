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
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { revalidateBooks } from '@/lib/actions/books';
import { Book } from '@/prisma/generated/client';

export default function DeleteBook({
  open,
  setOpen,
  book,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  book: Book;
}) {
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`/api/books/${book.id}`);
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Book deleted successfully');
      await revalidateBooks();
      setOpen(false);
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.response.data.message);
    },
  });

  const handleDelete = () => {
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Book - {book?.title}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this book? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            className='mr-2'
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
