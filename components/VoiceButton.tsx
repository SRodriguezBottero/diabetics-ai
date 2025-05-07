// components/VoiceButton.tsx
import { useEffect, useState } from 'react'

interface Props { onResult: (text: string) => void }

export default function VoiceButton({ onResult }: Props) {
  const [rec, setRec] = useState<any>(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return
    const r = new SpeechRecognition()
    r.lang = 'es-ES'
    r.continuous = false
    r.interimResults = false
    r.onresult = e => {
      const text = e.results[0][0].transcript
      onResult(text)
      setListening(false)
    }
    r.onend = () => setListening(false)
    setRec(r)
  }, [])

  const toggle = () => {
    if (!rec) return
    if (listening) rec.stop()
    else {
      setListening(true)
      rec.start()
    }
  }

  return (
    <button
      className={`p-2 rounded-full border ${listening? 'bg-red-200':'bg-white'}`}
      onClick={toggle}
    >
      🎤
    </button>
  )
}
