// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import prisma from '../../lib/prisma'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // 1) Extraemos messages y userId del body
  const { messages, userId } = req.body as {
    messages?: { role: 'user' | 'assistant' | 'system'; content: string }[],
    userId?: string
  }

  let systemContext = ''
  if (userId) {
    // Fetch last 30 readings for context
    const readings = await prisma.reading.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
      take: 30,
    })
    if (readings.length) {
      const data = readings.map(r => `${r.timestamp}: ${r.value} mg/dL`).join('\n')
      systemContext = `Estos son los últimos valores de glucosa del usuario:\n${data}\nPuedes usar estos datos para responder preguntas sobre su salud.`
    }
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

    res.status(200).json({ reply: completion.choices[0].message })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'OpenAI error' })
  }
}
