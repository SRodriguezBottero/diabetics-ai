import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { getUserUsage, checkAndResetUsage, FREE_TIER_LIMITS } from '../../lib/subscription'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  try {
    await checkAndResetUsage(session.user.id)
    const usage = await getUserUsage(session.user.id)

    res.status(200).json({
      ...usage,
      freeTierLimits: FREE_TIER_LIMITS,
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    res.status(500).json({ error: 'Error fetching subscription info' })
  }
}
