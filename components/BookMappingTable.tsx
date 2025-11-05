'use client';

import { useState, useTransition } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createOrUpdateBookMapping } from '@/lib/actions/book-mappings';
import { toast } from 'sonner';

interface BookMappingTableProps {
  productNames: string[];
  books: Array<{ id: string; title: string }>;
  existingMappings: Map<string, string>; // productName -> bookId
}

export function BookMappingTable({
  productNames,
  books,
  existingMappings,
}: BookMappingTableProps) {
  const [pending, startTransition] = useTransition();
  const [mappings, setMappings] = useState<Map<string, string>>(existingMappings);

  const handleMappingChange = (productName: string, bookId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('productName', productName);
      formData.append('bookId', bookId);

      const result = await createOrUpdateBookMapping({}, formData);
      
      if (result.success) {
        const newMappings = new Map(mappings);
        newMappings.set(productName, bookId);
        setMappings(newMappings);
        toast.success(`Mapped "${productName}" successfully`);
      } else {
        toast.error(result.error || 'Failed to save mapping');
      }
    });
  };

  const columns: ColumnDef<{ productName: string }>[] = [
    {
      accessorKey: 'productName',
      header: 'Product Name',
      cell: ({ row }) => {
        return <div className='font-medium'>{row.original.productName}</div>;
      },
    },
    {
      accessorKey: 'book',
      header: 'Mapped Book',
      cell: ({ row }) => {
        const currentBookId = mappings.get(row.original.productName);
        const currentBook = currentBookId
          ? books.find((b) => b.id === currentBookId)
          : null;

        return (
          <Select
            value={currentBookId || ''}
            onValueChange={(value) => {
              if (value) {
                handleMappingChange(row.original.productName, value);
              }
            }}
            disabled={pending}
          >
            <SelectTrigger className='w-full max-w-md'>
              <SelectValue placeholder='Select a book...' />
            </SelectTrigger>
            <SelectContent>
              {books.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {book.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isMapped = mappings.has(row.original.productName);
        return (
          <div
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isMapped
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}
          >
            {isMapped ? 'Mapped' : 'Unmapped'}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: productNames.map((name) => ({ productName: name })),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
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
                No product names found. Import some orders first.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className='flex items-center justify-end space-x-2 py-4 px-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
