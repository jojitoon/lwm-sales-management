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

    const { title, price, quantity } = body;

    const book = await prisma.book.create({
      data: {
        title,
        price: Number(price),
        total: Number(quantity),
        available: Number(quantity),
        preorderTotal: 0,
        preorderAvailable: 0,
        salesTotal: Number(quantity),
        salesAvailable: Number(quantity),
      },
    });

    console.log({ book });

    return NextResponse.json({ message: 'Book created', book });
  })(request, {});
}

export async function GET() {
  const books = await prisma.book.findMany();
  return NextResponse.json(books);
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
