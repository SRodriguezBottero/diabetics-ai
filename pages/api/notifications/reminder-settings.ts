import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'

interface ReminderSettings {
  reminderTime: string | null
  reminderEnabled: boolean
  timezone: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          reminderTime: true,
          reminderEnabled: true,
          timezone: true,
        },
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      return res.status(200).json({
        reminderTime: user.reminderTime,
        reminderEnabled: user.reminderEnabled,
        timezone: user.timezone || 'America/New_York',
      })
    } catch (error) {
      console.error('Error fetching reminder settings:', error)
      return res.status(500).json({ error: 'Failed to fetch settings' })
    }
  }

  if (req.method === 'POST') {
    const { reminderTime, reminderEnabled, timezone } = req.body as ReminderSettings

    if (reminderTime !== null && typeof reminderTime !== 'string') {
      return res.status(400).json({ error: 'Invalid reminder time' })
    }

    if (reminderTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM' })
    }

    if (typeof reminderEnabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid reminderEnabled value' })
    }

    try {
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          reminderTime,
          reminderEnabled,
          timezone: timezone || 'America/New_York',
        },
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error saving reminder settings:', error)
      return res.status(500).json({ error: 'Failed to save settings' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
