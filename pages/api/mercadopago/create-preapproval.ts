import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import {
  MERCADOPAGO_CURRENCY,
  MercadoPagoPayerError,
  preApproval,
  premiumPriceInUyu,
  resolveMercadoPagoBackUrl,
  resolveMercadoPagoPayerEmail,
} from '../../../lib/mercadopago'
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

    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined

    const preapprovalData = await preApproval.create({
      body: {
        reason: 'Diabetics-AI Premium',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: await premiumPriceInUyu(),
          currency_id: MERCADOPAGO_CURRENCY,
        },
        payer_email: await resolveMercadoPagoPayerEmail(user.email),
        back_url: resolveMercadoPagoBackUrl(origin),
        external_reference: session.user.id,
        status: 'pending',
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
    if (error instanceof MercadoPagoPayerError) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error creating MercadoPago subscription' })
  }
}
