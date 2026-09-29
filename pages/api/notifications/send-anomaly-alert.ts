import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { sendPushNotification } from '../../../lib/firebase-admin'

const GLUCOSE_LOW_THRESHOLD = 70
const GLUCOSE_HIGH_THRESHOLD = 180

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

  const { glucoseValue } = req.body

  if (typeof glucoseValue !== 'number') {
    return res.status(400).json({ error: 'Invalid glucose value' })
  }

  const isLow = glucoseValue < GLUCOSE_LOW_THRESHOLD
  const isHigh = glucoseValue > GLUCOSE_HIGH_THRESHOLD

  if (!isLow && !isHigh) {
    return res.status(200).json({ sent: false, reason: 'Value within normal range' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { fcmToken: true },
    })

    if (!user?.fcmToken) {
      return res.status(200).json({ sent: false, reason: 'No FCM token registered' })
    }

    const title = isLow 
      ? '⚠️ ¡Alerta de glucosa baja!' 
      : '⚠️ ¡Alerta de glucosa alta!'
    
    const body = isLow
      ? `Tu nivel de glucosa (${glucoseValue} mg/dL) está por debajo de ${GLUCOSE_LOW_THRESHOLD} mg/dL. Considera tomar medidas.`
      : `Tu nivel de glucosa (${glucoseValue} mg/dL) está por encima de ${GLUCOSE_HIGH_THRESHOLD} mg/dL. Considera tomar medidas.`

    await sendPushNotification(
      user.fcmToken,
      title,
      body,
      { 
        type: 'anomaly_alert',
        alertType: isLow ? 'low' : 'high',
        value: glucoseValue.toString(),
        url: '/'
      }
    )

    return res.status(200).json({ sent: true, alertType: isLow ? 'low' : 'high' })
  } catch (error) {
    console.error('Error sending anomaly alert:', error)
    return res.status(500).json({ error: 'Failed to send notification' })
  }
}
