import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { userId } = req.query as { userId: string }
  const last = await prisma.reading.findFirst({
    where: { userId },
    orderBy: { timestamp: 'desc' }
  })
  if (!last) return res.status(404).json({ error: 'No hay lecturas' })
  res.status(200).json(last)
}
