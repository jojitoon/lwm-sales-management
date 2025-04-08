'use server';
import { ActionResult } from 'next/dist/server/app-render/types';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { genericError } from '../utils';

export async function updateSettings(
  _: Record<string, string>,
  formData: FormData
): Promise<ActionResult & { success?: boolean }> {
  'use server';
  const session = await auth();
  if (!session) return { error: 'Unauthorised' };

  const sessionName = formData.get('session') ?? undefined;

  if (!session) {
    return {
      error: 'Session Required. Select One',
    };
  }

  try {
    await prisma.setting.update({
      data: { currentSession: sessionName?.toString() },
      where: { id: 'settings' },
    });
    revalidatePath('/admin-settings');
    return { success: true, error: '' };
  } catch {
    return genericError;
  }
}
