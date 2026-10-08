import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase'

type NotificationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

interface ReminderSettings {
  reminderTime: string | null
  reminderEnabled: boolean
  timezone: string
}

export default function Reminder() {
  const { t } = useTranslation('common')
  const [time, setTime] = useState<string>('')
  const [enabled, setEnabled] = useState<boolean>(false)
  const [status, setStatus] = useState<NotificationStatus>('idle')
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [timezone, setTimezone] = useState<string>('')

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(detectedTimezone)
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/notifications/reminder-settings')
        if (response.ok) {
          const settings: ReminderSettings = await response.json()
          setTime(settings.reminderTime || '')
          setEnabled(settings.reminderEnabled)
          if (settings.timezone) {
            setTimezone(settings.timezone)
          }
        }
      } catch (err) {
        console.error('Failed to fetch reminder settings:', err)
      }
    }

    fetchSettings()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setStatus('granted')
      } else if (Notification.permission === 'denied') {
        setStatus('denied')
      }
    } else {
      setStatus('unsupported')
    }
  }, [])

  useEffect(() => {
    const cleanup = onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload)
    })
    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  const requestPermissionAndToken = useCallback(async () => {
    setStatus('requesting')
    setError(null)

    try {
      const token = await requestNotificationPermission()
      
      if (token) {
        const response = await fetch('/api/notifications/register-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          throw new Error('Failed to register token')
        }

        setStatus('granted')
        return true
      } else {
        if (Notification.permission === 'denied') {
          setStatus('denied')
          setError(t('reminder.permissionDenied'))
        } else {
          setStatus('idle')
          setError(t('reminder.permissionFailed'))
        }
        return false
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err)
      setStatus('idle')
      setError(t('reminder.permissionError'))
      return false
    }
  }, [t])

  const saveSettings = useCallback(async (newTime: string, newEnabled: boolean) => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications/reminder-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderTime: newTime || null,
          reminderEnabled: newEnabled,
          timezone,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
    } catch (err) {
      console.error('Error saving reminder settings:', err)
      setError(t('reminder.saveError'))
    } finally {
      setSaving(false)
    }
  }, [timezone, t])

  const handleTimeChange = async (newTime: string) => {
    setTime(newTime)
    
    if (newTime && enabled) {
      await saveSettings(newTime, enabled)
    }
  }

  const handleToggle = async () => {
    const newEnabled = !enabled

    if (newEnabled) {
      // Always (re)register FCM token when enabling — browser permission
      // can already be "granted" while we still have no token saved.
      const granted = await requestPermissionAndToken()
      if (!granted) return
    }

    setEnabled(newEnabled)
    await saveSettings(time, newEnabled)
  }

  const getStatusIcon = () => {
    if (saving) {
      return (
        <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )
    }

    if (status === 'granted' && enabled) {
      return (
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    }

    if (status === 'denied') {
      return (
        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )
    }

    return (
      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  }

  if (status === 'unsupported') {
    return null
  }

  return (
    <section className="bg-white shadow-md rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <span className="font-medium">{t('reminder.title')}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="reminder-time" className="sr-only">
            {t('reminder.timeLabel')}
          </label>
          <input
            id="reminder-time"
            type="time"
            value={time}
            onChange={e => handleTimeChange(e.target.value)}
            className="border rounded p-1.5 text-sm"
            disabled={saving}
            aria-label={t('reminder.timeLabel')}
          />
          
          <button
            type="button"
            onClick={handleToggle}
            disabled={saving || status === 'requesting'}
            aria-label={t('reminder.toggleLabel')}
            aria-pressed={enabled && status === 'granted'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              enabled && status === 'granted'
                ? 'bg-indigo-600'
                : 'bg-gray-200'
            } ${saving || status === 'requesting' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled && status === 'granted' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <p className="text-gray-500 text-sm mt-2">
        {status === 'denied' 
          ? t('reminder.enableInBrowser')
          : enabled && status === 'granted'
          ? t('reminder.activeHint')
          : t('reminder.hint')
        }
      </p>

      {error && (
        <p className="text-red-700 text-sm mt-2" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
