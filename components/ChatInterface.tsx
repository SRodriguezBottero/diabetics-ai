import { useState } from 'react'
import VoiceButton from './VoiceButton'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function ChatInterface({ userId }: { userId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: '¡Hola! ¿En qué puedo ayudarte hoy? Si tienes preguntas sobre tu salud o los datos de glucosa que compartiste, no dudes en decírmelo.' }
  ])
  const [input, setInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)

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

  // Voice-driven logging: detect phrases like 'registrar glucosa 120' or 'anota 110'
  const tryVoiceLog = async (content: string) => {
    const logPattern = /(?:registrar|anota|agrega|guarda|pon|log(?:uea)?)(?:\s+(?:mi|una|la|el))?\s*(?:glucosa|glicemia|lectura|valor)?\s*(\d{2,3})/i
    const match = content.match(logPattern)
    if (match && match[1]) {
      const value = parseInt(match[1], 10)
      if (!isNaN(value)) {
        // Log the value
        await fetch('/api/readings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value, userId }),
        })
        const reply = `Registrado: ${value} mg/dL.`
        setMsgs(m => [...m, { role: 'user', content }, { role: 'assistant', content: reply }])
        setToast(`Registrado: ${value} mg/dL`)
        setTimeout(() => setToast(null), 3000)
        await playTTS(reply)
        return true
      }
    }
    return false
  }

  /* ───────── envío ───────── */

  const send = async (content: string) => {
    if (!content.trim()) return

    // Construir el historial actualizado manualmente
    const updatedMsgs = [...msgs, { role: 'user' as const, content }] as Msg[]
    setMsgs(updatedMsgs)
    setInput('')

    // 1. Voice-driven logging
    if (await tryVoiceLog(content)) return

    const norm = normalize(content)

    /* 2. Último control / medición */
    if (/(ultimo|ultima).*?(glicemia|glucosa|medic|valor)/.test(norm)) {
      const reply = await getLastReading()
      setMsgs(h => [...h, { role: 'assistant', content: reply }])
      await playTTS(reply)
      return
    }

    /* 3. Historial completo */
    if (
      /historial|todas? mis lecturas|todos? mis registros|muestrame mis datos/.test(norm)
    ) {
      const reply = await getAllReadings()
      setMsgs(h => [...h, { role: 'assistant', content: reply }])
      await playTTS(reply)
      return
    }

    // 4. conversación normal → OpenAI
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMsgs, userId })
    })
    const { reply } = await res.json()
    setMsgs(m => [...m, { role: 'assistant', content: reply.content }])
    await playTTS(reply.content)
  }

  /* ───────── UI ───────── */

  return (
    <div className="space-y-4 relative">
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
        <VoiceButton onResult={text => { setInput(text); send(text); }} />
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

      {/* Toast/Snackbar */}
      {toast && (
        <div className="fixed left-1/2 bottom-8 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
