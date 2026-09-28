import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { GetStaticProps } from 'next'
import ChatInterface from '../components/ChatInterface'
import RecentReadings from '../components/RecentReadings'
import HistoryChart from '../components/HistoryChart'
import AIInsights from '../components/AIInsights'
import ExportData from '../components/ExportData'
import ShareWithDoctor from '../components/ShareWithDoctor'
import MealClassifier from '../components/MealClassifier'
import LanguageSwitcher from '../components/LanguageSwitcher'

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
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white py-6 px-2 sm:py-10 sm:px-4 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        <header className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
              {t('app.title')}
            </h1>
            {!isOnline && (
              <p className="text-sm text-amber-600 mt-1">
                {t('offline.mode')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600 hidden sm:inline">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium"
            >
              {t('auth.signOut')}
            </button>
          </div>
        </header>

        <section className="bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">{t('readings.addNew')}</h2>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                placeholder={t('readings.glucoseLevel')}
                className="flex-1 border-gray-300 rounded-md px-3 py-3 text-base sm:text-sm w-full sm:w-auto"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyPress={handleKeyPress}
                inputMode="decimal"
              />
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500">{t('readings.unit')}</span>
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 sm:py-2 rounded-md w-full sm:w-auto font-semibold transition-colors"
                  onClick={addReading}
                >
                  {t('readings.add')}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-semibold">{t('chat.title')}</h2>
            <ChatInterface />
          </div>
        </section>

        <RecentReadings />
        <HistoryChart />
        <AIInsights />
        <ExportData />
        <ShareWithDoctor />
        <MealClassifier />
      </div>

      {toast && (
        <div
          className={`fixed left-1/2 bottom-8 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'warning'
              ? 'bg-amber-500 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'warning' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.text}
          </div>
        </div>
      )}
    </div>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'es', ['common'])),
  },
})
