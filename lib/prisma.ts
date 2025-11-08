import { PrismaClient } from '@/prisma/generated/client';

// Prevent multiple instances of Prisma Client
// This is critical to avoid connection pool exhaustion
// Use singleton pattern for both development and production
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma Client with optimized configuration
// Prisma manages its own connection pool internally
// The singleton pattern ensures only one instance exists, preventing connection exhaustion
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Store the client in global to prevent multiple instances
// This works in both development and production when using a custom server
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} else {
  // In production, also use global to ensure singleton
  globalForPrisma.prisma = prisma;
}

// Handle graceful shutdown to properly close connections
// Only in Node.js runtime (not Edge runtime used by middleware)
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  let isShuttingDown = false;
  let handlersRegistered = false;

  const gracefulShutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('Disconnecting Prisma client...');
    try {
      await prisma.$disconnect();
      console.log('Prisma client disconnected');
    } catch (error) {
      console.error('Error disconnecting Prisma client:', error);
    }
  };

  // Only register handlers once
  if (!handlersRegistered) {
    handlersRegistered = true;
    process.on('beforeExit', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }
}

// Export a function to disconnect (useful for cleanup)
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
