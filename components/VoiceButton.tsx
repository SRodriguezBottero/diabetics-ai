// components/VoiceButton.tsx
import { useEffect, useState } from 'react'

interface Props { onResult: (text: string) => void }

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: SpeechRecognitionResult;
      isFinal: boolean;
    };
  };
}

export default function VoiceButton({ onResult }: Props) {
  const [rec, setRec] = useState<SpeechRecognition | null>(null)
  const [listening, setListening] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SpeechRecognition) {
      console.log('Speech Recognition no está disponible')
      return
    }

    const r = new SpeechRecognition()
    r.lang = 'es-ES'
    r.continuous = true
    r.interimResults = true

    r.onresult = (e: SpeechRecognitionEvent) => {
      try {
        // Obtener los índices de los resultados
        const resultIndexes = Object.keys(e.results).filter(k => !isNaN(Number(k)))
        if (resultIndexes.length === 0) {
          console.log('No hay resultados')
          return
        }
        // Tomar el último resultado
        const lastIndex = Number(resultIndexes[resultIndexes.length - 1])
        const lastResult = e.results[lastIndex]
        if (!lastResult || !lastResult[0]) {
          console.log('No hay resultado final')
          return
        }
        const transcript = lastResult[0].transcript
        const isFinal = lastResult.isFinal
        console.log('Transcripción:', transcript, '¿Es final?', isFinal)
        if (isFinal) {
          const newText = text + ' ' + transcript
          const finalText = newText.trim()
          setText(finalText)
          onResult(finalText)
        }
      } catch (error) {
        console.error('Error procesando resultado:', error)
      }
    }

    r.onend = () => {
      console.log('Reconocimiento terminado, listening:', listening)
      if (listening) {
        try {
          r.start()
        } catch (error) {
          console.error('Error reiniciando reconocimiento:', error)
        }
      }
    }

    r.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Error en reconocimiento:', event.error, event.message)
    }

    setRec(r)
  }, [text])

  const toggle = () => {
    if (!rec) {
      console.log('No hay reconocimiento disponible')
      return
    }
    if (listening) {
      try {
        rec.stop()
        setListening(false)
        if (text.trim()) {
          onResult(text.trim())
          setText('')
        }
      } catch (error) {
        console.error('Error deteniendo reconocimiento:', error)
      }
    } else {
      try {
        setListening(true)
        setText('')
        rec.start()
      } catch (error) {
        console.error('Error iniciando reconocimiento:', error)
        setListening(false)
      }
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
