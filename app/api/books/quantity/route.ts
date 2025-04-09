import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  return auth(async (req) => {
    if (!req.auth || !req.auth.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id, quantity } = await request.json();

    const book = await prisma.book.update({
      where: { id },
      data: {
        total: {
          increment: quantity,
        },
        available: {
          increment: quantity,
        },
      },
    });

    return NextResponse.json({ message: 'Book updated', book });
  })(request, {});
}
