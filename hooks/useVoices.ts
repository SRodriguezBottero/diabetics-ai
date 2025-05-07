// hooks/useVoices.ts
import { useEffect, useState } from 'react'

export function useVoices(langPrefix = 'es') {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices()
      setVoices(all.filter(v => v.lang.startsWith(langPrefix)))
    }
    load()
    window.speechSynthesis.onvoiceschanged = load   // se dispara async :contentReference[oaicite:1]{index=1}
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [langPrefix])

  return voices
}
