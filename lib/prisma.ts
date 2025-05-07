// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // para evitar múltiples instancias en dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
