import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { sendPushNotification } from '../../../lib/firebase-admin'

function getCurrentTimeInTimezone(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const hour = parts.find(p => p.type === 'hour')?.value || '00'
    const minute = parts.find(p => p.type === 'minute')?.value || '00'
    return `${hour}:${minute}`
  } catch {
    return new Date().toISOString().slice(11, 16)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        reminderEnabled: true,
        fcmToken: { not: null },
        reminderTime: { not: null },
      },
      select: {
        id: true,
        fcmToken: true,
        reminderTime: true,
        timezone: true,
      },
    })

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const user of users) {
      if (!user.fcmToken || !user.reminderTime) continue

      const userTimezone = user.timezone || 'America/New_York'
      const currentTime = getCurrentTimeInTimezone(userTimezone)

      if (currentTime === user.reminderTime) {
        results.processed++
        try {
          await sendPushNotification(
            user.fcmToken,
            '¡Hora de registrar tu glucosa!',
            'No olvides anotar tu medición de glucosa en Diabetics-AI.',
            { type: 'daily_reminder', url: '/' }
          )
          results.sent++
        } catch (error) {
          results.failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.errors.push(`User ${user.id}: ${errorMessage}`)
          
          if (errorMessage.includes('not registered') || 
              errorMessage.includes('invalid registration') ||
              errorMessage.includes('NotRegistered')) {
            await prisma.user.update({
              where: { id: user.id },
              data: { fcmToken: null },
            })
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Error in send-reminders cron:', error)
    return res.status(500).json({ 
      error: 'Failed to process reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
