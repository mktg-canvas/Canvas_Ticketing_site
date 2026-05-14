import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { rlsStore } from './rlsContext'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prismaBase = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// Wrap every model operation in a transaction that sets per-request RLS context.
// The batch $transaction guarantees set_config and the query run on the same connection.
export const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const ctx = rlsStore.getStore()
        if (!ctx) return query(args)

        const [, result] = await (prismaBase.$transaction([
          prismaBase.$executeRaw`SELECT set_config('app.current_user_id', ${ctx.userId}, TRUE), set_config('app.current_user_role', ${ctx.role}, TRUE)`,
          query(args),
        ]) as Promise<[unknown, unknown]>)

        return result
      },
    },
  },
}) as unknown as PrismaClient
