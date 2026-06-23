import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    transactionOptions: {
      maxWait: 10000,
      timeout: 15000,
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma