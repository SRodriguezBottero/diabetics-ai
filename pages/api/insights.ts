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
    noData: 'Aún no hay suficientes datos para analizar.',
    systemPrompt: 'Eres un asistente médico experto en diabetes. Responde en español.',
    userPrompt: (data: string) => 
      `Eres un asistente médico para personas con diabetes. Analiza los siguientes valores de glucosa en sangre y proporciona un resumen breve en español, incluyendo tendencias, posibles riesgos y un consejo personalizado.\n\n${data}`,
  },
  en: {
    notAuthenticated: 'Not authenticated',
    noData: 'Not enough data to analyze yet.',
    systemPrompt: 'You are a medical assistant expert in diabetes. Answer in English.',
    userPrompt: (data: string) => 
      `You are a medical assistant for people with diabetes. Analyze the following blood glucose values and provide a brief summary in English, including trends, possible risks, and personalized advice.\n\n${data}`,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  const locale = (req.query.locale as 'es' | 'en') || 'es'
  const t = translations[locale] || translations.es
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: t.notAuthenticated })
  }

  const userId = session.user.id

  // Check usage limits
  const usageCheck = await checkUsageLimit(userId, 'insights')
  if (!usageCheck.allowed) {
    return res.status(200).json({ 
      insight: getUpgradeMessage('insights'),
      limitReached: true,
      remaining: usageCheck.remaining,
    })
  }

  const readings = await prisma.reading.findMany({
    where: { userId },
    orderBy: { timestamp: 'asc' },
    take: 30,
  })

  if (!readings.length) return res.status(200).json({ insight: t.noData })

  const data = readings.map(r => `${r.timestamp}: ${r.value} mg/dL`).join('\n')
  const prompt = t.userPrompt(data)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: t.systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
    })
    
    // Increment usage after successful API call
    await incrementUsage(userId, 'insights')
    
    const insight = completion.choices[0].message.content
    res.status(200).json({ 
      insight,
      remaining: usageCheck.remaining - 1,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'OpenAI error' })
  }
} 