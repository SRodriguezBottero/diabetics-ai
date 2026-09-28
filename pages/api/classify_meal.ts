// pages/api/classify_meal.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import OpenAI from 'openai'
import formidable from 'formidable'
import fs from 'fs/promises'
import { checkUsageLimit, incrementUsage, getUpgradeMessage } from '../../lib/subscription'

export const config = { api: { bodyParser: false } }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  const userId = session.user.id

  // Check usage limits
  const usageCheck = await checkUsageLimit(userId, 'meals')
  if (!usageCheck.allowed) {
    return res.status(200).json({ 
      error: 'limit-reached',
      message: getUpgradeMessage('meals'),
      limitReached: true,
    })
  }

  /* 1️⃣  Parsear la imagen */
  const form = formidable({ multiples: false })
  form.parse(req, async (err, _fields, files) => {
    if (err) return res.status(500).json({ error: 'parse-error' })
    const file = Array.isArray(files.image) ? files.image[0] : files.image
    if (!file) return res.status(400).json({ error: 'missing-image' })

    /* 2️⃣  Leer y convertir a Base64 (data URL) */
    const buffer = await fs.readFile(file.filepath)
    const b64 = buffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${b64}`

    /* 3️⃣  Llamar a GPT-4o con visión + salida JSON */
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',            // o gpt-4o
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  'Identifica la comida de esta foto y devuélveme un JSON con:\n' +
                  '{ "label": <nombre plato en español>, "carbs": <gramos de carbohidratos estimados como número> }. ' +
                  'Si no estás seguro, usa label:"desconocido" y carbs:null',
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      })

      const json = JSON.parse(completion.choices[0].message.content ?? '{}')
      
      // Increment usage after successful API call
      await incrementUsage(userId, 'meals')
      
      // json = { label: "pasta", carbs: 60 }
      return res.status(200).json({
        ...json,
        remaining: usageCheck.remaining - 1,
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({ error: 'openai-error' })
    }
  })
}