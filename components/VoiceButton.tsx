// components/VoiceButton.tsx
import { useEffect, useState } from 'react'

interface Props { onResult: (text: string) => void }

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

export default function VoiceButton({ onResult }: Props) {
  const [rec, setRec] = useState<SpeechRecognition | null>(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SpeechRecognition) return
    const r = new SpeechRecognition()
    r.lang = 'es-ES'
    r.continuous = false
    r.interimResults = false
    r.onresult = (e: SpeechRecognitionEvent) => {
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
    className={`rounded-full p-3 border ${
      listening ? 'bg-red-200' : 'bg-emerald-500 text-white'
    }`}
      onClick={toggle}
    >
      🎤
    </button>
  )
}
