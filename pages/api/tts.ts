import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { text, voice = 'nova' } = req.body

  try {
    const response = await client.audio.speech.create({
      model: 'tts-1',
      input: text,
      voice
    })

    res.setHeader('Content-Type', 'audio/mpeg')
    
    // Convert the response to a buffer and send it
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (error) {
    console.error('TTS Error:', error)
    res.status(500).json({ error: 'Failed to generate speech' })
  }
}
