// pages/api/classify_meal.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import formidable from 'formidable'
import fs from 'fs/promises'

export const config = { api: { bodyParser: false } }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const prompts = {
  es: 'Identifica la comida de esta foto y devuélveme un JSON con:\n' +
      '{ "label": <nombre plato en español>, "carbs": <gramos de carbohidratos estimados como número> }. ' +
      'Si no estás seguro, usa label:"desconocido" y carbs:null',
  en: 'Identify the food in this photo and return a JSON with:\n' +
      '{ "label": <dish name in English>, "carbs": <estimated carbohydrate grams as number> }. ' +
      'If you\'re not sure, use label:"unknown" and carbs:null',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = formidable({ multiples: false })
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'parse-error' })
    const file = Array.isArray(files.image) ? files.image[0] : files.image
    if (!file) return res.status(400).json({ error: 'missing-image' })

    const locale = (Array.isArray(fields.locale) ? fields.locale[0] : fields.locale) as 'es' | 'en' || 'es'
    const prompt = prompts[locale] || prompts.es

    const buffer = await fs.readFile(file.filepath)
    const b64 = buffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${b64}`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
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
      return res.status(200).json(json)
    } catch (e) {
      console.error(e)
      return res.status(500).json({ error: 'openai-error' })
    }
  })
}