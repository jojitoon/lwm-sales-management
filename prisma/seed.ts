// Seed admin user, settings, and base books from JSON
import fs from 'fs';
import path from 'path';
import { hashPassword } from '../lib/password';
import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function seedBooksFromJson() {
  const booksPath = path.join(process.cwd(), 'books.json');

  if (!fs.existsSync(booksPath)) {
    console.warn(
      `books.json not found at ${booksPath}, skipping book seeding.`,
    );
    return;
  }

  const raw = await fs.promises.readFile(booksPath, 'utf8');

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse books.json, skipping book seeding.', e);
    return;
  }

  if (!Array.isArray(data)) {
    console.error(
      'books.json must be an array of books, skipping book seeding.',
    );
    return;
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

  const books = (data as any[])
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
        b.price !== null,
    );

  if (!books.length) {
    console.warn('No valid books found in books.json, skipping book seeding.');
    return;
  }

  await prisma.book.createMany({
    data: books.map((b) => ({
      title: b.title,
      total: b.total,
      available: b.total,
      preorderTotal: 0,
      preorderAvailable: 0,
      salesTotal: 0,
      salesAvailable: 0,
      price: b.price as number,
      isActive: true,
      isCombo: false,
    })),
    skipDuplicates: true,
  });

  console.log(`Seeded ${books.length} books from books.json`);
}

async function main() {
  const adminPassword = await hashPassword('admin');

  await prisma.user.upsert({
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

  await prisma.setting.upsert({
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

  await seedBooksFromJson();

  console.log('Admin user and base books created');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
