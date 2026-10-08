import { useTranslation } from 'react-i18next'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { GetStaticProps } from 'next'
import AppLayout from '../components/AppLayout'
import ChatInterface from '../components/ChatInterface'
import AIInsights from '../components/AIInsights'
import MealClassifier from '../components/MealClassifier'

export default function AIPage() {
  const { t } = useTranslation('common')

  return (
    <AppLayout title={t('app.pageTitleAI')}>
      <div className="py-4 px-3 sm:py-6 sm:px-4">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <header className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-700">
              {t('nav.ai')}
            </h1>
          </header>

          <section className="bg-white shadow-md rounded-xl p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-semibold mb-3">{t('chat.title')}</h2>
            <ChatInterface />
          </section>

          <AIInsights />

          <section className="bg-white shadow-md rounded-xl p-4 sm:p-5">
            <MealClassifier />
          </section>
        </div>
      </div>
    </AppLayout>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'es', ['common'])),
  },
})
