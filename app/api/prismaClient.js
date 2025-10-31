import { PrismaClient } from '@prisma/client';

// This prevents Prisma Client from being initialized multiple times in development
// due to Next.js's hot reloading.
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
