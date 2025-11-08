import { BookListTable } from '@/components/BookListTable';
import RefAddBook from '@/components/RefAddBook';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export default async function BookLeftReport() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.isAdmin || false;

  const data = await prisma.book.findMany({
    where: {
      // Include combo books only for admin users
      ...(isAdmin ? {} : { isCombo: false }),
    },
  });

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
