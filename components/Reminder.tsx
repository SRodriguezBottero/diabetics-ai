// components/Reminder.tsx
import { useEffect } from 'react'

export default function Reminder() {
  useEffect(() => {
    if (!('Notification' in window)) return
    Notification.requestPermission().then(perm => {
      if (perm !== 'granted') return
      // Ejemplo: recordatorio cada 24 h
      setInterval(() => {
        new Notification('Recordatorio de medicación', {
          body: 'Es hora de tu dosis de insulina.',
        })
      }, 1000 * 60 * 60 * 24)
    })
  }, [])
  return null
}
