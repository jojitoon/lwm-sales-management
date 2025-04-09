import { BookListTable } from '@/components/BookListTable';
import RefAddBook from '@/components/RefAddBook';
import { prisma } from '@/lib/prisma';

export default async function BookLeftReport() {
  const data = await prisma.book.findMany();

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8 '>
        <h1 className='text-2xl font-bold my-2'>All Books</h1>
        <RefAddBook />
      </div>

      <BookListTable data={data} />
    </main>
  );
}
