import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import prisma from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  const userId = session.user.id

  if (req.method === 'POST') {
    const { value } = req.body
    const reading = await prisma.reading.create({ data: { value, userId } })
    return res.status(201).json(reading)
  }

  if (req.method === 'GET') {
    const readings = await prisma.reading.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' }
    })
    return res.status(200).json(readings)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end()
}
