//create admin user
import { hashPassword } from '../lib/password';
import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

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

  console.log('Admin user created');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
