import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import prisma from '../../lib/prisma'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { userId } = req.query as { userId: string }
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  // Fetch last 30 readings (or all if less)
  const readings = await prisma.reading.findMany({
    where: { userId },
    orderBy: { timestamp: 'asc' },
    take: 30,
  })

  if (!readings.length) return res.status(200).json({ insight: 'Aún no hay suficientes datos para analizar.' })

  // Prepare data for prompt
  const data = readings.map(r => `${r.timestamp}: ${r.value} mg/dL`).join('\n')
  const prompt = `Eres un asistente médico para personas con diabetes. Analiza los siguientes valores de glucosa en sangre y proporciona un resumen breve en español, incluyendo tendencias, posibles riesgos y un consejo personalizado.\n\n${data}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un asistente médico experto en diabetes. Responde en español.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
    })
    const insight = completion.choices[0].message.content
    res.status(200).json({ insight })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'OpenAI error' })
  }
} 