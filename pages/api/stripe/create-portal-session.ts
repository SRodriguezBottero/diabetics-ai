import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { stripe } from '../../../lib/stripe'
import prisma from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No subscription found' })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${req.headers.origin}/pricing`,
    })

    res.status(200).json({ url: portalSession.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    res.status(500).json({ error: 'Error creating portal session' })
  }
}
