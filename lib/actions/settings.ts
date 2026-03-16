'use server';
import fs from 'fs';
import path from 'path';
import { ActionResult } from 'next/dist/server/app-render/types';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { genericError } from '../utils';
import { hashPassword } from '@/lib/password';

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

export async function resetDatabase(): Promise<{
  success?: boolean;
  error?: string;
}> {
  'use server';
  const session = await auth();
  if (!session) return { error: 'Unauthorised' };

  const loadBooksFromJson = async () => {
    const booksPath = path.join(process.cwd(), 'books.json');

    if (!fs.existsSync(booksPath)) {
      console.warn(`books.json not found at ${booksPath}, skipping book seeding.`);
      return [];
    }

    const raw = await fs.promises.readFile(booksPath, 'utf8');

    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse books.json, skipping book seeding.', e);
      return [];
    }

    if (!Array.isArray(data)) {
      console.error('books.json must be an array of books, skipping book seeding.');
      return [];
    }

    const parsePrice = (value: unknown): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const numeric = value.replace(/[^\d.,]/g, '').replace(/,/g, '');
        const parsed = Number.parseFloat(numeric);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const parseTotal = (value: unknown): number => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const numeric = value.replace(/[^\d]/g, '');
        const parsed = Number.parseInt(numeric, 10);
        if (Number.isFinite(parsed)) return parsed;
      }
      return 0;
    };

    return (data as any[])
      .map((item) => {
        const price = parsePrice(item.price);
        const total = parseTotal(item.total);
        return {
          title: item.title,
          price,
          total,
        };
      })
      .filter(
        (b) =>
          typeof b.title === 'string' &&
          b.title.trim().length > 0 &&
          b.price !== null
      );
  };

  try {
    const adminPassword = await hashPassword('admin');

    await prisma.$transaction(async (tx) => {
      await tx.bookSaleItem.deleteMany();
      await tx.bookSale.deleteMany();
      await tx.orderItem.deleteMany();
      await tx.consolidation.deleteMany();
      await tx.preOrder.deleteMany();
      await tx.mainStoreRequest.deleteMany();
      await tx.miniStoreRequest.deleteMany();
      await tx.mySession.deleteMany();
      await tx.preorderSession.deleteMany();
      await tx.tableSaleSession.deleteMany();
      await tx.miniStoreSession.deleteMany();
      await tx.mainStoreSession.deleteMany();
      await tx.comboBookItem.deleteMany();
      await tx.bookMapping.deleteMany();
      await tx.book.deleteMany();
      await tx.session.deleteMany();
      await tx.account.deleteMany();
      await tx.verificationToken.deleteMany();
      await tx.setting.deleteMany();
      await tx.user.deleteMany();

      const books = await loadBooksFromJson();

      await tx.user.upsert({
        where: {
          email: 'admin@admin.com',
        },
        update: {
          isAdmin: true,
          name: 'Admin',
        },
        create: {
          email: 'admin@admin.com',
          isAdmin: true,
          name: 'Admin',
        },
      });

      await tx.setting.upsert({
        where: {
          id: 'settings',
        },
        update: {
          adminPassword,
        },
        create: {
          id: 'settings',
          adminPassword,
        },
      });

      if (books.length) {
        await tx.book.createMany({
          data: books.map((b) => ({
            title: b.title,
            total: b.total,
            available: b.total,
            preorderTotal: 0,
            preorderAvailable: 0,
            salesTotal: 0,
            salesAvailable: 0,
            price: b.price,
            isActive: true,
            isCombo: false,
          })),
          skipDuplicates: true,
        });
      }
    });

    revalidatePath('/');
    return { success: true, error: '' };
  } catch {
    return genericError;
  }
}

type DatabaseBackup = {
  users: any[];
  accounts: any[];
  sessions: any[];
  verificationTokens: any[];
  settings: any[];
  preOrders: any[];
  orderItems: any[];
  consolidations: any[];
  preorderSessions: any[];
  tableSaleSessions: any[];
  mySessions: any[];
  miniStoreSessions: any[];
  mainStoreSessions: any[];
  mainStoreRequests: any[];
  miniStoreRequests: any[];
  books: any[];
  bookSales: any[];
  bookSaleItems: any[];
  bookMappings: any[];
  comboBookItems: any[];
};

export async function exportDatabase(): Promise<{
  success?: boolean;
  error?: string;
  data?: string;
}> {
  'use server';
  const session = await auth();
  if (!session) return { error: 'Unauthorised' };

  try {
    const backup: DatabaseBackup = {
      users: await prisma.user.findMany(),
      accounts: await prisma.account.findMany(),
      sessions: await prisma.session.findMany(),
      verificationTokens: await prisma.verificationToken.findMany(),
      settings: await prisma.setting.findMany(),
      preOrders: await prisma.preOrder.findMany(),
      orderItems: await prisma.orderItem.findMany(),
      consolidations: await prisma.consolidation.findMany(),
      preorderSessions: await prisma.preorderSession.findMany(),
      tableSaleSessions: await prisma.tableSaleSession.findMany(),
      mySessions: await prisma.mySession.findMany(),
      miniStoreSessions: await prisma.miniStoreSession.findMany(),
      mainStoreSessions: await prisma.mainStoreSession.findMany(),
      mainStoreRequests: await prisma.mainStoreRequest.findMany(),
      miniStoreRequests: await prisma.miniStoreRequest.findMany(),
      books: await prisma.book.findMany(),
      bookSales: await prisma.bookSale.findMany(),
      bookSaleItems: await prisma.bookSaleItem.findMany(),
      bookMappings: await prisma.bookMapping.findMany(),
      comboBookItems: await prisma.comboBookItem.findMany(),
    };

    return {
      success: true,
      error: '',
      data: JSON.stringify(backup),
    };
  } catch {
    return genericError;
  }
}

export async function importDatabase(json: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  'use server';
  const session = await auth();
  if (!session) return { error: 'Unauthorised' };

  let backup: DatabaseBackup;

  try {
    backup = JSON.parse(json) as DatabaseBackup;
  } catch {
    return { error: 'Invalid backup file' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.bookSaleItem.deleteMany();
      await tx.bookSale.deleteMany();
      await tx.orderItem.deleteMany();
      await tx.consolidation.deleteMany();
      await tx.preOrder.deleteMany();
      await tx.mainStoreRequest.deleteMany();
      await tx.miniStoreRequest.deleteMany();
      await tx.mySession.deleteMany();
      await tx.preorderSession.deleteMany();
      await tx.tableSaleSession.deleteMany();
      await tx.miniStoreSession.deleteMany();
      await tx.mainStoreSession.deleteMany();
      await tx.comboBookItem.deleteMany();
      await tx.bookMapping.deleteMany();
      await tx.book.deleteMany();
      await tx.session.deleteMany();
      await tx.account.deleteMany();
      await tx.verificationToken.deleteMany();
      await tx.setting.deleteMany();
      await tx.user.deleteMany();

      if (backup.users?.length)
        await tx.user.createMany({ data: backup.users });
      if (backup.accounts?.length)
        await tx.account.createMany({ data: backup.accounts });
      if (backup.sessions?.length)
        await tx.session.createMany({ data: backup.sessions });
      if (backup.verificationTokens?.length)
        await tx.verificationToken.createMany({
          data: backup.verificationTokens,
        });
      if (backup.settings?.length)
        await tx.setting.createMany({ data: backup.settings });
      if (backup.books?.length)
        await tx.book.createMany({ data: backup.books });
      if (backup.bookMappings?.length)
        await tx.bookMapping.createMany({ data: backup.bookMappings });
      if (backup.comboBookItems?.length)
        await tx.comboBookItem.createMany({ data: backup.comboBookItems });
      if (backup.preOrders?.length)
        await tx.preOrder.createMany({ data: backup.preOrders });
      if (backup.tableSaleSessions?.length)
        await tx.tableSaleSession.createMany({
          data: backup.tableSaleSessions,
        });
      if (backup.mainStoreSessions?.length)
        await tx.mainStoreSession.createMany({
          data: backup.mainStoreSessions,
        });
      if (backup.miniStoreSessions?.length)
        await tx.miniStoreSession.createMany({
          data: backup.miniStoreSessions,
        });
      if (backup.preorderSessions?.length)
        await tx.preorderSession.createMany({ data: backup.preorderSessions });
      if (backup.mySessions?.length)
        await tx.mySession.createMany({ data: backup.mySessions });
      if (backup.bookSales?.length)
        await tx.bookSale.createMany({ data: backup.bookSales });
      if (backup.bookSaleItems?.length)
        await tx.bookSaleItem.createMany({ data: backup.bookSaleItems });
      if (backup.mainStoreRequests?.length)
        await tx.mainStoreRequest.createMany({
          data: backup.mainStoreRequests,
        });
      if (backup.miniStoreRequests?.length)
        await tx.miniStoreRequest.createMany({
          data: backup.miniStoreRequests,
        });
      if (backup.consolidations?.length)
        await tx.consolidation.createMany({ data: backup.consolidations });
      if (backup.orderItems?.length)
        await tx.orderItem.createMany({ data: backup.orderItems });
    });

    revalidatePath('/');
    return { success: true, error: '' };
  } catch {
    return genericError;
  }
}
