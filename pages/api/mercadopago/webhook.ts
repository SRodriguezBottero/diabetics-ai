import type { NextApiRequest, NextApiResponse } from 'next'
import { preApproval } from '../../../lib/mercadopago'
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

  const { type, data } = req.body

  try {
    if (type === 'preapproval') {
      const preapprovalId = data?.id
      if (!preapprovalId) {
        return res.status(400).json({ error: 'Missing preapproval ID' })
      }

      const preapprovalData = await preApproval.get({ id: preapprovalId })
      const userId = preapprovalData.external_reference

      if (!userId) {
        console.error('No external_reference (userId) in preapproval:', preapprovalId)
        return res.status(400).json({ error: 'No user reference found' })
      }

      const status = mapMercadoPagoStatus(preapprovalData.status)

      const updateData: Record<string, unknown> = {
        mercadopagoPreapprovalId: preapprovalId,
        paymentProvider: 'mercadopago',
        subscriptionStatus: status,
      }

      if (preapprovalData.payer_id) {
        updateData.mercadopagoPayerId = String(preapprovalData.payer_id)
      }

      if (preapprovalData.next_payment_date) {
        updateData.currentPeriodEnd = new Date(preapprovalData.next_payment_date)
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      })

      console.log(`MercadoPago preapproval updated: ${preapprovalId}, status: ${status}`)
    }

    if (type === 'authorized_payment') {
      const paymentId = data?.id
      if (paymentId) {
        console.log(`MercadoPago authorized payment received: ${paymentId}`)
      }
    }

    if (type === 'subscription_preapproval') {
      const preapprovalId = data?.id
      if (preapprovalId) {
        const preapprovalData = await preApproval.get({ id: preapprovalId })
        const userId = preapprovalData.external_reference

        if (userId) {
          const status = mapMercadoPagoStatus(preapprovalData.status)
          
          const updateData: Record<string, unknown> = {
            subscriptionStatus: status,
          }

          if (preapprovalData.next_payment_date) {
            updateData.currentPeriodEnd = new Date(preapprovalData.next_payment_date)
          }

          await prisma.user.update({
            where: { id: userId },
            data: updateData,
          })

          console.log(`MercadoPago subscription updated: ${preapprovalId}, status: ${status}`)
        }
      }
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('MercadoPago webhook error:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
}

function mapMercadoPagoStatus(mpStatus: string | undefined): string {
  switch (mpStatus) {
    case 'authorized':
    case 'active':
      return 'active'
    case 'paused':
    case 'pending':
      return 'past_due'
    case 'cancelled':
    case 'canceled':
      return 'canceled'
    default:
      return 'free'
  }
}
