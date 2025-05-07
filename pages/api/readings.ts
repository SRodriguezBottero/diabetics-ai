import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { value, userId } = req.body
    const reading = await prisma.reading.create({ data: { value, userId } })
    return res.status(201).json(reading)
  }

  if (req.method === 'GET') {
    const { userId } = req.query as { userId: string }
    const readings = await prisma.reading.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' }
    })
    return res.status(200).json(readings)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end()
}
