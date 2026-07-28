import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client'

// Suppress known pg driver adapter concurrency warning (pg v8.13+ deprecation notice)
if (typeof process !== 'undefined' && process.emitWarning) {
  const originalEmitWarning = process.emitWarning
  process.emitWarning = (warning: any, ...args: any[]) => {
    const msg = typeof warning === 'string' ? warning : warning?.message
    if (msg && msg.includes('Calling client.query() when the client is already executing a query')) {
      return
    }
    return (originalEmitWarning as any)(warning, ...args)
  }
}

const prismaClientSingleton = () => {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
