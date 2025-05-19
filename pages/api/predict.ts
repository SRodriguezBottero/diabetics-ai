import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import prisma from '../../lib/prisma'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  for (let i = 0; i < n; i++) {
    const x = xs[i]
    const y = ys[i]
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { userId } = req.query as { userId: string }
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  const readings = await prisma.reading.findMany({
    where: { userId },
    orderBy: { timestamp: 'asc' },
    take: 30,
  })

  if (readings.length < 3) {
    return res.status(200).json({ message: 'Aún no hay suficientes datos para predecir.' })
  }

  const times = readings.map(r => new Date(r.timestamp).getTime())
  const values = readings.map(r => r.value)
  const t0 = times[0]
  const xs = times.map(t => (t - t0) / (1000 * 60)) // minutos desde el inicio

  const { slope, intercept } = linearRegression(xs, values)
  const future = xs[xs.length - 1] + 30 // 30 minutos adelante
  const predicted = intercept + slope * future

  let alert: 'low' | 'high' | null = null
  if (predicted < 70) alert = 'low'
  else if (predicted > 180) alert = 'high'

  let advice: string | undefined
  if (alert) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un asistente médico experto en diabetes. Responde en español.' },
          { role: 'user', content: `Mi nivel de glucosa podría ser ${Math.round(predicted)} mg/dL en 30 minutos. ¿Qué me recomiendas?` },
        ],
        max_tokens: 80,
      })
      advice = completion.choices[0].message.content
    } catch (e) {
      console.error(e)
    }
  }

  res.status(200).json({ predicted, alert, advice })
}
