import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import VoiceButton from './VoiceButton'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function ChatInterface() {
  const { t } = useTranslation('common')
  const { locale } = useRouter()
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: t('chat.greeting') }
  ])
  const [input, setInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const fmt = (ts: string) =>
    new Date(ts).toLocaleString(locale === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'short', timeStyle: 'short' })

  const getLastReading = async () => {
    const r = await fetch('/api/readings/last')
    if (!r.ok) return t('readings.noReadings')
    const { value, timestamp } = await r.json()
    return t('readings.lastReading', { value, date: fmt(timestamp) })
  }

  const getAllReadings = async () => {
    const r = await fetch('/api/readings')
    if (!r.ok) return t('readings.couldNotRetrieve')
    const arr: { value: number; timestamp: string }[] = await r.json()
    if (!arr.length) return t('readings.noReadings')
    return arr
      .map(o => `${fmt(o.timestamp)} → ${o.value} mg/dL`)
      .join('\n')
  }

  const playTTS = async (text: string) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, locale })
    })
    const blob = await res.blob()
    new Audio(URL.createObjectURL(blob)).play()
  }

  const normalize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  const tryVoiceLog = async (content: string) => {
    const esPattern = /(?:registrar|anota|agrega|guarda|pon|log(?:uea)?)(?:\s+(?:mi|una|la|el))?\s*(?:glucosa|glicemia|lectura|valor)?\s*(\d{2,3})/i
    const enPattern = /(?:log|record|add|save|register)(?:\s+(?:my|a|the))?\s*(?:glucose|blood\s*sugar|reading|value)?\s*(\d{2,3})/i
    
    const match = content.match(locale === 'en' ? enPattern : esPattern)
    if (match && match[1]) {
      const value = parseInt(match[1], 10)
      if (!isNaN(value)) {
        await fetch('/api/readings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        })
        const reply = t('readings.registered', { value })
        setMsgs(m => [...m, { role: 'user', content }, { role: 'assistant', content: reply }])
        setToast(reply)
        setTimeout(() => setToast(null), 3000)
        await playTTS(reply)
        return true
      }
    }
    return false
  }

  const send = async (content: string) => {
    if (!content.trim()) return

    const updatedMsgs = [...msgs, { role: 'user' as const, content }] as Msg[]
    setMsgs(updatedMsgs)
    setInput('')

    if (await tryVoiceLog(content)) return

    const norm = normalize(content)

    const esLastPattern = /(ultimo|ultima).*?(glic|gluc|medic|valor|result)/
    const enLastPattern = /(last|latest|recent).*?(glic|gluc|read|value|result)/
    
    if ((locale === 'en' ? enLastPattern : esLastPattern).test(norm)) {
      const reply = await getLastReading()
      setMsgs(h => [...h, { role: 'assistant', content: reply }])
      await playTTS(reply)
      return
    }

    const esHistoryPattern = /historial|todas? mis lecturas|todos? mis registros|muestrame mis datos/
    const enHistoryPattern = /history|all my readings|all my records|show me my data/
    
    if ((locale === 'en' ? enHistoryPattern : esHistoryPattern).test(norm)) {
      const reply = await getAllReadings()
      setMsgs(h => [...h, { role: 'assistant', content: reply }])
      await playTTS(reply)
      return
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMsgs, locale })
    })
    const data = await res.json()
    const replyContent = data.reply?.content || data.reply
    
    if (data.limitReached) {
      setMsgs(m => [...m, { 
        role: 'assistant', 
        content: `${replyContent}\n\n[Actualiza a Premium para mensajes ilimitados →](/pricing)` 
      }])
    } else {
      setMsgs(m => [...m, { role: 'assistant', content: replyContent }])
      await playTTS(replyContent)
    }
  }

  return (
    <div className="space-y-4 relative">
      <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-2">
        ⚠️ {t('ai.disclaimer')}
      </div>
      <div className="h-64 overflow-y-auto space-y-2" role="log" aria-live="polite" aria-relevant="additions">
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
        <label htmlFor="chat-input" className="sr-only">
          {t('chat.inputLabel')}
        </label>
        <input
          id="chat-input"
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('chat.placeholder')}
          aria-label={t('chat.inputLabel')}
        />
        <button
          type="button"
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 rounded-md"
          onClick={() => send(input)}
        >
          {t('chat.send')}
        </button>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 bottom-8 transform -translate-x-1/2 bg-emerald-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
