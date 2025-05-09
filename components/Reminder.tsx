// components/Reminder.tsx
import { useEffect, useState } from 'react'

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission()
  }
}

function showNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('¡Hora de registrar tu glucosa!', {
      body: 'No olvides anotar tu medición de glucosa en Diabetics-AI.',
      icon: '/favicon.ico',
    })
  }
}

export default function Reminder() {
  const [time, setTime] = useState<string>('')

  // Load saved time from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reminderTime')
    if (saved) setTime(saved)
    requestNotificationPermission()
  }, [])

  // Save time to localStorage
  const saveTime = (t: string) => {
    setTime(t)
    localStorage.setItem('reminderTime', t)
  }

  // Check every minute if it's time to notify
  useEffect(() => {
    if (!time) return
    const interval = setInterval(() => {
      const now = new Date()
      const [h, m] = time.split(':').map(Number)
      if (now.getHours() === h && now.getMinutes() === m && now.getSeconds() < 10) {
        showNotification()
      }
    }, 10000) // check every 10 seconds for demo purposes
    return () => clearInterval(interval)
  }, [time])

  return (
    <section className="bg-white shadow rounded-lg p-4 mb-4 flex items-center gap-4">
      <span className="font-medium">⏰ Recordatorio diario:</span>
      <input
        type="time"
        value={time}
        onChange={e => saveTime(e.target.value)}
        className="border rounded p-1"
      />
      <span className="text-gray-500 text-sm">Te avisaremos a esta hora cada día.</span>
    </section>
  )
}
