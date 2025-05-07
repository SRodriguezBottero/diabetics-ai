// components/VoiceSelector.tsx
import { useState } from 'react'
import { useVoices } from '../hooks/useVoices'

export default function VoiceSelector({ onChange }: { onChange: (voice: SpeechSynthesisVoice | null) => void }) {
  const voices = useVoices()
  const [sel, setSel] = useState<SpeechSynthesisVoice | null>(null)

  return (
    <select
      className="border p-2 rounded"
      value={sel?.name || ''}
      onChange={e => {
        const v = voices.find(v => v.name === e.target.value) || null
        setSel(v); onChange(v)
      }}>
      {voices.map(v => (
        <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
      ))}
    </select>
  )
}
