import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

function createPrismaClient() {
  // Supabase's pooler presents a cert chain that node-postgres flags as
  // self-signed. `sslmode=require` in the URL makes node-postgres verify it (and
  // reject), so strip it and disable verification explicitly — the connection is
  // still TLS-encrypted. (Production: pin Supabase's CA instead.)
  const connectionString = (process.env.DATABASE_URL ?? "").replace(
    /[?&]sslmode=[^&]*/i,
    ""
  )
  const adapter = new PrismaPg({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
