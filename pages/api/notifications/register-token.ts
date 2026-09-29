import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { token } = req.body

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' })
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { fcmToken: token },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error saving FCM token:', error)
    return res.status(500).json({ error: 'Failed to save token' })
  }
}
