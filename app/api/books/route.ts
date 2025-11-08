import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { title, price, quantity, isCombo, comboItems } = body;

    // For combo books, quantities should be 0
    const isComboBook = isCombo === true;
    const bookQuantities = isComboBook
      ? {
          total: 0,
          available: 0,
          preorderTotal: 0,
          preorderAvailable: 0,
          salesTotal: 0,
          salesAvailable: 0,
        }
      : {
          total: Number(quantity),
          available: Number(quantity),
          preorderTotal: 0,
          preorderAvailable: 0,
          salesTotal: Number(quantity),
          salesAvailable: Number(quantity),
        };

    const book = await prisma.book.create({
      data: {
        title,
        price: Number(price),
        isCombo: isComboBook,
        ...bookQuantities,
        ...(isComboBook &&
          comboItems &&
          Array.isArray(comboItems) &&
          comboItems.length > 0 && {
            comboItems: {
              create: comboItems.map((item: any) => ({
                componentBookId: item.componentBookId,
                quantity: item.quantity || 1,
              })),
            },
          }),
      },
      include: {
        comboItems: {
          include: {
            componentBook: true,
          },
        },
      },
    });

    console.log({ book });

    return NextResponse.json({ message: 'Book created', book });
  })(request, {});
}

export async function GET(request: NextRequest) {
  return auth(async (req) => {
    const isAdmin = (req.auth?.user as any)?.isAdmin || false;

    const books = await prisma.book.findMany({
      where: {
        // Include combo books only for admin users
        ...(isAdmin ? {} : { isCombo: false }),
      },
      include: {
        comboItems: {
          include: {
            componentBook: true,
          },
        },
      },
    });
    return NextResponse.json(books);
  })(request, {});
}

export async function PATCH(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { id, title, price, quantity } = body;

    const book = await prisma.book.update({
      where: { id },
      data: {
        title,
        ...(price && { price: Number(price) }),
        ...(quantity && {
          total: Number(quantity),
          available: Number(quantity),
        }),
      },
    });

    return NextResponse.json({ message: 'Book updated', book });
  })(request, {});
}
