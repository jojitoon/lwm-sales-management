import { prisma } from '@/lib/prisma';
import { BookMappingTable } from '@/components/BookMappingTable';

export default async function MapBooksPage() {
  // Get all unique product names from order items
  const orderItems = await prisma.orderItem.findMany({
    select: {
      productName: true,
    },
    distinct: ['productName'],
    orderBy: {
      productName: 'asc',
    },
  });

  // Get all books
  const books = await prisma.book.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      title: 'asc',
    },
    select: {
      id: true,
      title: true,
    },
  });

  // Get existing mappings
  const mappings = await prisma.bookMapping.findMany({
    include: {
      book: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Create a map for quick lookup
  const mappingMap = new Map(
    mappings.map((m) => [m.productName, m.bookId])
  );

  const productNames = orderItems.map((item) => item.productName);

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-2xl font-bold my-2'>Map Books</h1>
          <p className='text-muted-foreground'>
            Map imported product names from order items to existing books in the
            system
          </p>
        </div>
      </div>

      <BookMappingTable
        productNames={productNames}
        books={books}
        existingMappings={mappingMap}
      />
    </main>
  );
}
