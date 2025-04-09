import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const hasSales = await prisma.bookSaleItem.findFirst({
      where: {
        bookId: id,
      },
    });

    if (hasSales) {
      return NextResponse.json(
        { message: 'Book has sales, cannot delete' },
        { status: 400 }
      );
    }

    const hasPreorders = await prisma.orderItem.findFirst({
      where: {
        bookId: id,
      },
    });

    if (hasPreorders) {
      return NextResponse.json(
        { message: 'Book has preorders, cannot delete' },
        { status: 400 }
      );
    }

    const book = await prisma.book.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Book deleted', book });
  })(request, {});
}
