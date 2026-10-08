import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { preApproval, PREMIUM_PRICE_USD } from '../../../lib/mercadopago'
import prisma from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!preApproval) {
    return res.status(500).json({ error: 'MercadoPago is not configured' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, mercadopagoPayerId: true },
    })

    if (!user?.email) {
      return res.status(400).json({ error: 'User email not found' })
    }

    const baseUrl = req.headers.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const preapprovalData = await preApproval.create({
      body: {
        reason: 'Diabetics-AI Premium',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: PREMIUM_PRICE_USD,
          currency_id: 'USD',
        },
        payer_email: user.email,
        back_url: `${baseUrl}/pricing?mercadopago=true`,
        external_reference: session.user.id,
      },
    })

    if (preapprovalData.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          paymentProvider: 'mercadopago',
          mercadopagoPreapprovalId: preapprovalData.id,
        },
      })
    }

    res.status(200).json({ url: preapprovalData.init_point })
  } catch (error) {
    console.error('MercadoPago preapproval error:', error)
    res.status(500).json({ error: 'Error creating MercadoPago subscription' })
  }
}
