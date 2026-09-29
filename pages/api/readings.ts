import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import prisma from '../../lib/prisma'
import { sendPushNotification } from '../../lib/firebase-admin'

const GLUCOSE_LOW_THRESHOLD = 70
const GLUCOSE_HIGH_THRESHOLD = 180

async function sendAnomalyAlert(userId: string, glucoseValue: number) {
  const isLow = glucoseValue < GLUCOSE_LOW_THRESHOLD
  const isHigh = glucoseValue > GLUCOSE_HIGH_THRESHOLD

  if (!isLow && !isHigh) return

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    })

    if (!user?.fcmToken) return

    const title = isLow 
      ? '⚠️ ¡Alerta de glucosa baja!' 
      : '⚠️ ¡Alerta de glucosa alta!'
    
    const body = isLow
      ? `Tu nivel de glucosa (${glucoseValue} mg/dL) está por debajo de ${GLUCOSE_LOW_THRESHOLD} mg/dL.`
      : `Tu nivel de glucosa (${glucoseValue} mg/dL) está por encima de ${GLUCOSE_HIGH_THRESHOLD} mg/dL.`

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
  } catch (error) {
    console.error('Error sending anomaly alert:', error)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  const userId = session.user.id

  if (req.method === 'POST') {
    const { value } = req.body
    const reading = await prisma.reading.create({ data: { value, userId } })
    
    sendAnomalyAlert(userId, value).catch(console.error)
    
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
