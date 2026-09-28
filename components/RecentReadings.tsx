import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'

interface Reading {
  id?: string
  value: number
  timestamp: string
  pending?: boolean
}

export default function RecentReadings() {
  const { t } = useTranslation('common')
  const { locale } = useRouter()
  const [items, setItems] = useState<Reading[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const CACHE_KEY = 'diabetics-ai-readings-cache'
    
    const loadCached = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          setItems(JSON.parse(cached))
        }
      } catch {
        console.error('Failed to load cached readings')
      }
    }

    const fetchData = async () => {
      try {
        const response = await fetch('/api/readings')
        if (response.ok) {
          const data = await response.json()
          setItems(data)
          localStorage.setItem(CACHE_KEY, JSON.stringify(data))
          setIsOffline(false)
        } else if (response.status === 503) {
          loadCached()
          setIsOffline(true)
        }
      } catch {
        loadCached()
        setIsOffline(true)
      } finally {
        setIsLoading(false)
      }
    }

    const handleOnline = () => {
      setIsOffline(false)
      fetchData()
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    setIsOffline(!navigator.onLine)
    fetchData()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isLoading && !items.length) {
    return (
      <section className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{t('readings.recent')}</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      </section>
    )
  }

  if (!items.length) return null

  const dateLocale = locale === 'en' ? enUS : es

  return (
    <section className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t('readings.recent')}</h2>
        {isOffline && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            {t('offline.cachedData')}
          </span>
        )}
      </div>
      <ul className="divide-y divide-gray-200">
        {items
          .slice(-5)
          .reverse()
          .map((r, i) => (
            <li key={r.id || i} className="py-2 flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-indigo-700">{r.value} mg/dL</span>
                {r.pending && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('offline.pending')}
                  </span>
                )}
              </div>
              <span className="text-gray-500">
                {format(new Date(r.timestamp), 'PPPP, p', { locale: dateLocale })}
              </span>
            </li>
          ))}
      </ul>
    </section>
  )
}
