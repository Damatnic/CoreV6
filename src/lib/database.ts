import { PrismaClient } from '@/generated/prisma'
import type { PrismaClient as PrismaType } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaType | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma