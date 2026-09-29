// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import OpenAI from 'openai'
import prisma from '../../lib/prisma'
import { checkUsageLimit, incrementUsage, getUpgradeMessage } from '../../lib/subscription'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const translations = {
  es: {
    notAuthenticated: 'No autenticado',
    glucoseContext: (data: string) => 
      `Estos son los últimos valores de glucosa del usuario:\n${data}\nPodés usar estos datos para ayudarle a entender patrones y preparar información para compartir con su médico. No hagas diagnósticos ni des consejos médicos específicos.`,
    systemPrompt: 'Sos un compañero de registro de glucosa. Ayudás a los usuarios a entender patrones en sus datos para que puedan compartirlos con su médico. Respondé en español. No sos médico ni das diagnósticos.',
  },
  en: {
    notAuthenticated: 'Not authenticated',
    glucoseContext: (data: string) => 
      `These are the user's latest glucose values:\n${data}\nYou can use this data to help them understand patterns and prepare information to share with their doctor. Do not diagnose or give specific medical advice.`,
    systemPrompt: 'You are a glucose logging companion. You help users understand patterns in their data so they can share it with their doctor. Answer in English. You are not a doctor and do not diagnose.',
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    const locale = (req.body?.locale as 'es' | 'en') || 'es'
    return res.status(401).json({ error: translations[locale].notAuthenticated })
  }

  const userId = session.user.id
  const locale = (req.body?.locale as 'es' | 'en') || 'es'
  const t = translations[locale] || translations.es

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
    systemContext = t.glucoseContext(data)
  }

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
            content: t.systemPrompt,
          },
        ]

  try {
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
