'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { genericError } from '../utils';

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function createOrUpdateBookMapping(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult & { success?: boolean }> {
  'use server';
  const session = await auth();
  if (!session) return { error: 'Unauthorised' };

  const productName = formData.get('productName')?.toString();
  const bookId = formData.get('bookId')?.toString();

  if (!productName || !bookId) {
    return {
      error: 'Product name and book are required',
    };
  }

  try {
    await prisma.bookMapping.upsert({
      where: { productName },
      update: { bookId },
      create: {
        productName,
        bookId,
      },
    });
    revalidatePath('/map-books');
    return { success: true, error: '' };
  } catch (error: any) {
    return { error: error?.message || 'Failed to create/update mapping' };
  }
}

export async function deleteBookMapping(
  productName: string
): Promise<ActionResult & { success?: boolean }> {
  'use server';
  const session = await auth();
  if (!session) return { error: 'Unauthorised' };

  try {
    await prisma.bookMapping.delete({
      where: { productName },
    });
    revalidatePath('/map-books');
    return { success: true, error: '' };
  } catch {
    return genericError;
  }
}
