// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import OpenAI from 'openai'
import prisma from '../../lib/prisma'
import { checkUsageLimit, incrementUsage, getUpgradeMessage } from '../../lib/subscription'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  const userId = session.user.id

  // Check usage limits
  const usageCheck = await checkUsageLimit(userId, 'chat')
  if (!usageCheck.allowed) {
    return res.status(200).json({ 
      reply: { 
        role: 'assistant', 
        content: getUpgradeMessage('chat') 
      },
      limitReached: true,
      remaining: usageCheck.remaining,
    })
  }

  const { messages } = req.body as {
    messages?: { role: 'user' | 'assistant' | 'system'; content: string }[]
  }

  let systemContext = ''
  const readings = await prisma.reading.findMany({
    where: { userId },
    orderBy: { timestamp: 'asc' },
    take: 30,
  })
  if (readings.length) {
    const data = readings.map(r => `${r.timestamp}: ${r.value} mg/dL`).join('\n')
    systemContext = `Estos son los últimos valores de glucosa del usuario:\n${data}\nPuedes usar estos datos para responder preguntas sobre su salud.`
  }

  // 2) Si viene vacío o undefined, creamos uno de sistema
  const safeMessages =
    messages && messages.length
      ? [
          ...(systemContext
            ? [{ role: 'system' as const, content: systemContext }]
            : []),
          ...messages,
        ]
      : [
          {
            role: 'system' as const,
            content: 'You are a helpful assistant. Answer in Spanish.',
          },
        ]

  try {
    // 3) Llamamos a OpenAI con el array ya seguro
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: safeMessages,
    })

    // Increment usage after successful API call
    await incrementUsage(userId, 'chat')

    res.status(200).json({ 
      reply: completion.choices[0].message,
      remaining: usageCheck.remaining - 1,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'OpenAI error' })
  }
}
