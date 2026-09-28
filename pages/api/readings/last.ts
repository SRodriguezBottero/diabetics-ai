import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  const userId = session.user.id

  const last = await prisma.reading.findFirst({
    where: { userId },
    orderBy: { timestamp: 'desc' }
  })

  if (!last) return res.status(404).json({ error: 'No hay lecturas' })
  res.status(200).json(last)
}
