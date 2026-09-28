import { useState } from 'react'
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

export default function Home() {
  const { data: session } = useSession()
  const { t } = useTranslation('common')
  const [value, setValue] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const addReading = async () => {
    const val = parseFloat(value)
    if (isNaN(val)) return
    await fetch('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: val }),
    })
    setValue('')
    setToast(t('readings.registered', { value: val }))
    setTimeout(() => setToast(null), 3000)
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white py-6 px-2 sm:py-10 sm:px-4 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
            {t('app.title')}
          </h1>
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
        </div>
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
              />
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500">{t('readings.unit')}</span>
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 sm:py-2 rounded-md w-full sm:w-auto font-semibold"
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
        <div className="fixed left-1/2 bottom-8 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
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