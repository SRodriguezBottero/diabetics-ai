import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '../../../lib/stripe'
import prisma from '../../../lib/prisma'
import Stripe from 'stripe'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const userId = session.metadata?.userId
          if (!userId) {
            const customer = await stripe.customers.retrieve(session.customer as string)
            const userIdFromCustomer = (customer as Stripe.Customer).metadata?.userId
            
            if (userIdFromCustomer) {
              await updateUserSubscription(userIdFromCustomer, subscription)
            }
          } else {
            await updateUserSubscription(userId, subscription)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        const userId = (customer as Stripe.Customer).metadata?.userId

        if (userId) {
          await updateUserSubscription(userId, subscription)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        const userId = (customer as Stripe.Customer).metadata?.userId

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionId: null,
              subscriptionStatus: 'free',
              priceId: null,
              currentPeriodEnd: null,
            },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customer = await stripe.customers.retrieve(invoice.customer as string)
        const userId = (customer as Stripe.Customer).metadata?.userId

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: 'past_due',
            },
          })
        }
        break
      }
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
}

async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  const status = subscription.status === 'active' || subscription.status === 'trialing'
    ? 'active'
    : subscription.status === 'canceled'
    ? 'canceled'
    : subscription.status === 'past_due'
    ? 'past_due'
    : 'free'

  // The Stripe API returns current_period_end but newer SDK versions may have different types
  // Use billing_cycle_anchor as a fallback for period tracking
  const subscriptionAny = subscription as unknown as Record<string, unknown>
  const periodEndTimestamp = subscriptionAny.current_period_end as number | undefined
  const currentPeriodEnd = periodEndTimestamp 
    ? new Date(periodEndTimestamp * 1000)
    : new Date(subscription.billing_cycle_anchor * 1000)

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: status,
      priceId: subscription.items.data[0]?.price.id || null,
      currentPeriodEnd,
    },
  })
}
