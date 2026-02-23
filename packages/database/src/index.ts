import { PrismaClient } from '@prisma/client';

// Fallback DATABASE_URL if not set (for healthcheck to work without DB)
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set. Database features will be disabled.');
  process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
