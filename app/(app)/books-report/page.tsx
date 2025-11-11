import { BookTable } from '@/components/BookTable';
import { SessionServerFilter } from '@/components/SessionServerFilter';
import { ServerDownload } from '@/components/ServerDownload';
import { ReconcileConsolidationsButton } from '@/components/ReconcileConsolidationsButton';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export default async function BookReport({
  searchParams,
}: {
  searchParams?: Promise<{ session: string }>;
}) {
  const authSession = await auth();
  const isAdmin = (authSession?.user as any)?.isAdmin || false;
  const querySession = (await searchParams)?.session;
  const settings = await prisma.setting.findUnique({
    where: {
      id: 'settings',
    },
  });
  const isAll = querySession === 'All';

  const data = await prisma.orderItem.groupBy({
    where: {
      ...(!isAll
        ? {
            consolidation: {
              session: querySession || settings?.currentSession || '',
            },
          }
        : {
            consolidationId: {
              not: null,
            },
          }),
    },
    by: ['productName'],
    _sum: { quantity: true },
  });

  const session = querySession || settings?.currentSession || '';

  // Get consolidations for this session to check if reconciliation is needed
  let consolidations: any[] = [];
  let canReconcile = false;
  if (isAdmin && session !== 'All') {
    consolidations = await prisma.consolidation.findMany({
      where: { session },
      include: {
        items: {
          include: {
            book: true,
            order: true,
          },
        },
        user: {
          include: {
            mySessions: {
              where: {
                session: session,
                workspace: 'pre-order',
                isActive: true,
              },
              include: {
                preorderSession: {
                  include: {
                    tableSaleSession: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Check if there are consolidations without stock movement
    // Stock movement would have occurred if items were collected and stock was deducted
    const productNames = consolidations
      .flatMap((c) => c.items)
      .filter((item) => item.isCollected)
      .map((item) => item.productName);

    const bookMappings = await prisma.bookMapping.findMany({
      where: {
        productName: {
          in: productNames,
        },
      },
    });

    const mappedProductNames = new Set(bookMappings.map((m) => m.productName));

    // Check if any consolidation has items that should have affected stock but didn't
    // This happens when items have mappings but stock wasn't deducted
    const hasUnreconciledItems = consolidations.some((consolidation) => {
      const userSession = consolidation.user?.mySessions?.[0];
      if (!userSession?.preorderSession?.tableSaleSession) {
        return false; // No table session, so no stock to reconcile
      }

      return consolidation.items.some((item: any) => {
        if (!item.isCollected) return false;
        const hasBookMapping = item.bookId || mappedProductNames.has(item.productName);
        return hasBookMapping; // Has mapping but stock might not have been deducted
      });
    });

    canReconcile = hasUnreconciledItems;
  }

  return (
    <main className='px-4 lg:px-6'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold my-2'>
          Book Reports -{' '}
          {session === 'All' ? 'All Session' : session?.replace(/_/g, ' ')}
        </h1>

        <div className='flex items-center gap-4'>
          <SessionServerFilter session={session} />
          <ServerDownload
            data={data.map((item) => ({
              productName: item.productName,
              quantity: item._sum?.quantity || 0,
            }))}
            name={'books-sold.xlsx'}
            // isMultiple
          />
          {isAdmin && session !== 'All' && canReconcile && (
            <ReconcileConsolidationsButton session={session} />
          )}
        </div>
      </div>

      <BookTable
        data={
          data as {
            productName: string;
            _sum: {
              quantity: number;
            };
          }[]
        }
      />
    </main>
  );
}
