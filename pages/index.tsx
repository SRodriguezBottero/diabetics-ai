import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { GetStaticProps } from 'next'
import AppLayout from '../components/AppLayout'
import RecentReadings from '../components/RecentReadings'
import PlanIndicator from '../components/PlanIndicator'

interface ToastMessage {
  text: string
  type: 'success' | 'warning' | 'error'
}

export default function Home() {
  const { data: session } = useSession()
  const { t } = useTranslation('common')
  const [value, setValue] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingReadings, setPendingReadings] = useState(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      if (pendingReadings > 0) {
        setToast({ text: t('offline.syncing'), type: 'success' })
        setTimeout(() => setToast(null), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [pendingReadings, t])

  const addReading = async () => {
    const val = parseFloat(value)
    if (isNaN(val)) {
      setToast({ text: t('readings.invalidValue'), type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    try {
      const response = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val }),
      })

      setValue('')

      if (response.ok) {
        setToast({ text: t('readings.registered', { value: val }), type: 'success' })
      } else if (response.status === 202) {
        setPendingReadings(prev => prev + 1)
        setToast({ text: t('offline.savedOffline', { value: val }), type: 'warning' })
      }
    } catch {
      setValue('')
      setPendingReadings(prev => prev + 1)
      setToast({ text: t('offline.savedOffline', { value: val }), type: 'warning' })
    }

    setTimeout(() => setToast(null), 3000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addReading()
    }
  }

  return (
    <AppLayout title={t('app.pageTitleHome')}>
      <div className="min-h-full bg-gradient-to-b from-gray-100 to-white py-4 px-3 sm:py-6 sm:px-4">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <header className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-indigo-700">
                {t('app.title')}
              </h1>
              {!isOnline && (
                <p className="text-sm text-amber-800 mt-1">
                  {t('offline.mode')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PlanIndicator />
              <span className="text-sm text-gray-500 hidden sm:inline truncate max-w-[160px]">
                {session?.user?.email}
              </span>
            </div>
          </header>

          <section className="bg-white shadow-md rounded-xl p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-semibold mb-3">{t('readings.addNew')}</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="glucose-value" className="sr-only">
                {t('readings.glucoseLevel')}
              </label>
              <input
                id="glucose-value"
                type="number"
                placeholder={t('readings.glucoseLevel')}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyPress={handleKeyPress}
                inputMode="decimal"
                aria-label={t('readings.glucoseLevel')}
              />
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500">{t('readings.unit')}</span>
                <button
                  type="button"
                  className="btn-primary flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold"
                  onClick={addReading}
                >
                  {t('readings.add')}
                </button>
              </div>
            </div>
          </section>

          <RecentReadings />
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 bottom-24 px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-800 text-white'
              : toast.type === 'warning'
              ? 'bg-amber-700 text-white'
              : 'bg-red-700 text-white'
          }`}
        >
          <div className="flex items-center gap-2 justify-center">
            {toast.type === 'warning' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.text}
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'es', ['common'])),
  },
})
