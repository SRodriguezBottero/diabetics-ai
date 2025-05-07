// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // 1) Extraemos messages del body
  const { messages } = req.body as {
    messages?: { role: 'user' | 'assistant' | 'system'; content: string }[]
  }

  // 2) Si viene vacío o undefined, creamos uno de sistema
  const safeMessages =
    messages && messages.length
      ? messages
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
