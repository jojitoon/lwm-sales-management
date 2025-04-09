'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { IconDotsVertical } from '@tabler/icons-react';
import EditBook from './EditBook';
import { Book } from '@/prisma/generated/client';
import { useState } from 'react';
import EditBookQuantity from './EditBookQuantity';
import DeleteBook from './DeleteBook';
import { useSession } from 'next-auth/react';

export const BookListTable = ({
  data,
}: {
  data: {
    title: string;
    price: number;
    total: number;
    available: number;
  }[];
}) => {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin as boolean;
  const [book, setBook] = useState<Book | null>(null);
  const [editBookQuantity, setEditBookQuantity] = useState<Book | null>(null);
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);

  const columns: ColumnDef<{
    title: string;
    price: number;
    total: number;
    available: number;
  }>[] = [
    {
      accessorKey: 'title',
      cell: ({ row }) => {
        return <div className='capitalize'>{row.original.title}</div>;
      },
      header: 'Title',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <div>{`${Number(row.original.price).toLocaleString('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`}</div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <div>{Number(row.original.total).toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'available',
      header: 'Available',
      cell: ({ row }) => (
        <div>{Number(row.original.available).toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <IconDotsVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => {
                    console.log(row.original);

                    setBook(row.original as Book);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => {
                  console.log(row.original);

                  setEditBookQuantity(row.original as Book);
                }}
              >
                Increase Stock
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  className='text-red-500'
                  onClick={() => {
                    setDeleteBook(row.original as Book);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <main className=''>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <EditBook
          open={!!book}
          setOpen={() => setBook(null)}
          book={book as Book}
        />
        <EditBookQuantity
          open={!!editBookQuantity}
          setOpen={() => setEditBookQuantity(null)}
          book={editBookQuantity as Book}
        />
        <DeleteBook
          open={!!deleteBook}
          setOpen={() => setDeleteBook(null)}
          book={deleteBook as Book}
        />
      </div>
    </main>
  );
};
