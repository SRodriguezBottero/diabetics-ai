// components/Reminder.tsx
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission()
  }
}

export default function Reminder() {
  const { t } = useTranslation('common')
  const [time, setTime] = useState<string>('')

  const showNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t('reminder.notificationTitle'), {
        body: t('reminder.notificationBody'),
        icon: '/favicon.ico',
      })
    }
  }, [t])

  useEffect(() => {
    const saved = localStorage.getItem('reminderTime')
    if (saved) setTime(saved)
    requestNotificationPermission()
  }, [])

  const saveTime = (newTime: string) => {
    setTime(newTime)
    localStorage.setItem('reminderTime', newTime)
  }

  useEffect(() => {
    if (!time) return
    const interval = setInterval(() => {
      const now = new Date()
      const [h, m] = time.split(':').map(Number)
      if (now.getHours() === h && now.getMinutes() === m && now.getSeconds() < 10) {
        showNotification()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [time, showNotification])

  return (
    <section className="bg-white shadow rounded-lg p-4 mb-4 flex items-center gap-4">
      <span className="font-medium">{t('reminder.title')}</span>
      <input
        type="time"
        value={time}
        onChange={e => saveTime(e.target.value)}
        className="border rounded p-1"
      />
      <span className="text-gray-500 text-sm">{t('reminder.hint')}</span>
    </section>
  )
}
