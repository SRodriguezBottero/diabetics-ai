import { useState } from 'react'
import VoiceButton from './VoiceButton'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function ChatInterface({ userId }: { userId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')

  /* ───────── helpers ───────── */

  const fmt = (ts: string) =>
    new Date(ts).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })

  const getLastReading = async () => {
    const r = await fetch(`/api/readings/${userId}/last`)
    if (!r.ok) return 'Aún no tienes lecturas registradas.'
    const { value, timestamp } = await r.json()
    return `Tu último control fue ${value} mg/dL el ${fmt(timestamp)}.`
  }

  const getAllReadings = async () => {
    const r = await fetch(`/api/readings?userId=${userId}`)
    if (!r.ok) return 'No pude recuperar tu historial.'
    const arr: { value: number; timestamp: string }[] = await r.json()
    if (!arr.length) return 'Aún no tienes lecturas registradas.'
    return arr
      .map(o => `${fmt(o.timestamp)} → ${o.value} mg/dL`)
      .join('\n')
  }

  const playTTS = async (text: string) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    const blob = await res.blob()
    new Audio(URL.createObjectURL(blob)).play()
  }

  const normalize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  

  /* ───────── envío ───────── */

  const send = async (content: string) => {
    if (!content.trim()) return
    setMsgs(m => [...m, { role: 'user', content }])
    setInput('')

    const norm = normalize(content)  

/* 1. Último control / medición */
if (/(ultimo|ultima).*?(glicemia|glucosa|medic|valor)/.test(norm)) {
  const reply = await getLastReading()
  setMsgs(h => [...h, { role: 'assistant', content: reply }])
  await playTTS(reply)
  return
}

/* 2. Historial completo */
if (
  /historial|todas? mis lecturas|todos? mis registros|muestrame mis datos/.test(norm)
) {
  const reply = await getAllReadings()
  setMsgs(h => [...h, { role: 'assistant', content: reply }])
  await playTTS(reply)
  return
}


    // 3. conversación normal → OpenAI
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs }) // ya no pasamos userId
    })
    const { reply } = await res.json()
    setMsgs(m => [...m, { role: 'assistant', content: reply.content }])
    await playTTS(reply.content)
  }

  /* ───────── UI ───────── */

  return (
    <div className="space-y-4">
      <div className="h-64 overflow-y-auto space-y-2">
        {msgs.map((m,i) => (
          <div key={i} className={m.role==='user' ? 'text-right' : 'text-left'}>
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
          placeholder="¿Cómo puedo ayudarte?"
        />
        <button
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-md"
          onClick={() => send(input)}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
