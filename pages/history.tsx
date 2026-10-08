import { useTranslation } from 'react-i18next'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { GetStaticProps } from 'next'
import AppLayout from '../components/AppLayout'
import HistoryChart from '../components/HistoryChart'
import RecentReadings from '../components/RecentReadings'

export default function History() {
  const { t } = useTranslation('common')

  return (
    <AppLayout title={t('app.pageTitleHistory')}>
      <div className="py-4 px-3 sm:py-6 sm:px-4">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <header className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-700">
              {t('history.pageTitle')}
            </h1>
          </header>

          <section className="bg-white shadow-md rounded-xl p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-semibold mb-3">{t('history.title')}</h2>
            <HistoryChart />
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-semibold mb-3">{t('readings.recent')}</h2>
            <RecentReadings showAll />
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
