import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get all combo items for a combo book
export async function GET(
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

    const comboItems = await prisma.comboBookItem.findMany({
      where: { comboBookId: id },
      include: {
        componentBook: true,
      },
    });

    return NextResponse.json(comboItems);
  })(request, {});
}

// POST - Add a component book to a combo book
export async function POST(
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
    const body = await request.json();
    const { componentBookId, quantity } = body;

    if (!componentBookId) {
      return NextResponse.json(
        { message: 'componentBookId is required' },
        { status: 400 }
      );
    }

    // Verify the combo book exists and is actually a combo book
    const comboBook = await prisma.book.findUnique({
      where: { id },
      select: { isCombo: true },
    });

    if (!comboBook) {
      return NextResponse.json(
        { message: 'Combo book not found' },
        { status: 404 }
      );
    }

    if (!comboBook.isCombo) {
      return NextResponse.json(
        { message: 'Book is not a combo book' },
        { status: 400 }
      );
    }

    // Verify component book exists
    const componentBook = await prisma.book.findUnique({
      where: { id: componentBookId },
      select: { id: true },
    });

    if (!componentBook) {
      return NextResponse.json(
        { message: 'Component book not found' },
        { status: 404 }
      );
    }

    // Prevent adding a combo book as a component of itself
    if (id === componentBookId) {
      return NextResponse.json(
        { message: 'Cannot add a combo book as a component of itself' },
        { status: 400 }
      );
    }

    try {
      const comboItem = await prisma.comboBookItem.create({
        data: {
          comboBookId: id,
          componentBookId,
          quantity: quantity || 1,
        },
        include: {
          componentBook: true,
        },
      });

      return NextResponse.json({
        message: 'Component book added to combo',
        comboItem,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return NextResponse.json(
          { message: 'This component book is already part of the combo' },
          { status: 400 }
        );
      }
      throw error;
    }
  })(request, {});
}

// DELETE - Remove a component book from a combo book
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
    const { searchParams } = new URL(request.url);
    const componentBookId = searchParams.get('componentBookId');

    if (!componentBookId) {
      return NextResponse.json(
        { message: 'componentBookId query parameter is required' },
        { status: 400 }
      );
    }

    const comboItem = await prisma.comboBookItem.findFirst({
      where: {
        comboBookId: id,
        componentBookId,
      },
    });

    if (!comboItem) {
      return NextResponse.json(
        { message: 'Combo item not found' },
        { status: 404 }
      );
    }

    await prisma.comboBookItem.delete({
      where: { id: comboItem.id },
    });

    return NextResponse.json({
      message: 'Component book removed from combo',
    });
  })(request, {});
}

// PATCH - Update the quantity of a component book in a combo
export async function PATCH(
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
    const body = await request.json();
    const { componentBookId, quantity } = body;

    if (!componentBookId || quantity === undefined) {
      return NextResponse.json(
        { message: 'componentBookId and quantity are required' },
        { status: 400 }
      );
    }

    const comboItem = await prisma.comboBookItem.findFirst({
      where: {
        comboBookId: id,
        componentBookId,
      },
    });

    if (!comboItem) {
      return NextResponse.json(
        { message: 'Combo item not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.comboBookItem.update({
      where: { id: comboItem.id },
      data: { quantity },
      include: {
        componentBook: true,
      },
    });

    return NextResponse.json({
      message: 'Combo item updated',
      comboItem: updated,
    });
  })(request, {});
}
