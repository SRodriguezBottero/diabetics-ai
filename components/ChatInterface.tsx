import { useState } from 'react'
import VoiceButton from './VoiceButton'

type Msg = { role: 'user' | 'assistant'; content: string }

/* ────── util para quitar acentos y pasar a minúsculas ────── */
const normalize = (str: string) =>
  str
    .normalize('NFD')                 // separa letra + acento
    .replace(/[\u0300-\u036f]/g, '')  // quita los acentos
    .toLowerCase()

export default function ChatInterface({ userId }: { userId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')

  /* ───────── helpers ───────── */

  const fmt = (ts: string) =>
    new Date(ts).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

  const getLastReading = async () => {
    try {
      const r = await fetch(`/api/readings/${userId}/last`)
      if (!r.ok) throw new Error('no lecturas')
      const { value, timestamp } = await r.json()
      return `Tu último control fue ${value} mg/dL el ${fmt(timestamp)}.`
    } catch {
      return 'Aún no tienes lecturas registradas.'
    }
  }

  const getAllReadings = async () => {
    try {
      const r = await fetch(`/api/readings?userId=${userId}`)
      if (!r.ok) throw new Error('error')
      const arr: { value: number; timestamp: string }[] = await r.json()
      if (!arr.length) return 'Aún no tienes lecturas registradas.'
      return arr.map(o => `${fmt(o.timestamp)} → ${o.value} mg/dL`).join('\n')
    } catch {
      return 'No pude recuperar tu historial.'
    }
  }

  const playTTS = async (text: string) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const blob = await res.blob()
    new Audio(URL.createObjectURL(blob)).play()
  }

  /* ───────── envío ───────── */

  const send = async (content: string) => {
    if (!content.trim()) return

    // historial actualizado (incluye el mensaje que acaba de escribir el usuario)
    const history = [...msgs, { role: 'user' as const, content }]

    // pintamos en pantalla
    setMsgs(history)
    setInput('')

    const norm = normalize(content)

    /* 1. Último control */
    if (/(ultimo|ultima).*glicemia/.test(norm)) {
      const reply = await getLastReading()
      setMsgs(h => [...h, { role: 'assistant', content: reply }])
      await playTTS(reply)
      return
    }

    /* 2. Historial completo */
    if (/historial|todas? mis lecturas|todos? mis registros/.test(norm)) {
      const reply = await getAllReadings()
      setMsgs(h => [...h, { role: 'assistant', content: reply }])
      await playTTS(reply)
      return
    }

    /* 3. Conversación normal → OpenAI */
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }), // nunca está vacío
    })
    const { reply } = await res.json()

    setMsgs(h => [...h, { role: 'assistant', content: reply.content }])
    await playTTS(reply.content)
  }

  /* ───────── UI ───────── */

  return (
    <div className="p-4 space-y-4">
      <div className="h-64 overflow-y-auto space-y-2">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={m.role === 'user' ? 'text-right' : 'text-left'}
          >
            <span className="inline-block px-3 py-1 rounded bg-blue-100 whitespace-pre-line">
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <VoiceButton onResult={setInput} />
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe o dicta..."
        />
        <button
          className="bg-blue-500 text-white px-4 rounded"
          onClick={() => send(input)}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
