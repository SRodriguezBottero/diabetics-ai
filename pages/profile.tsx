import { useSession, signOut } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { GetStaticProps } from 'next'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Reminder from '../components/Reminder'
import ExportData from '../components/ExportData'
import ShareWithDoctor from '../components/ShareWithDoctor'
import UsageMeter from '../components/UsageMeter'
import PlanIndicator from '../components/PlanIndicator'

export default function ProfilePage() {
  const { data: session } = useSession()
  const { t } = useTranslation('common')

  return (
    <AppLayout title={t('app.pageTitleProfile')}>
      <div className="min-h-full bg-gradient-to-b from-gray-100 to-white py-4 px-3 sm:py-6 sm:px-4">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <header className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-700">
              {t('nav.profile')}
            </h1>
          </header>

          <section className="bg-white shadow-md rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">{t('auth.email')}</p>
                <p className="font-medium text-gray-900 truncate">{session?.user?.email}</p>
              </div>
              <PlanIndicator />
            </div>
            <UsageMeter />
          </section>

          <section className="bg-white shadow-md rounded-xl p-4 sm:p-5 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold">{t('profile.settings')}</h2>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">{t('language.switch')}</span>
              <LanguageSwitcher />
            </div>
          </section>

          <Reminder />

          <section className="bg-white shadow-md rounded-xl p-4 sm:p-5 space-y-3">
            <h2 className="text-base sm:text-lg font-semibold">{t('profile.data')}</h2>
            <ExportData />
            <ShareWithDoctor />
          </section>

          <section className="bg-white shadow-md rounded-xl p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-semibold mb-3">{t('profile.subscription')}</h2>
            <Link
              href="/pricing"
              className="block w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-3 px-4 rounded-lg transition-colors duration-150"
            >
              {t('profile.managePlan')}
            </Link>
          </section>

          <section className="pt-2">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors duration-150"
            >
              {t('auth.signOut')}
            </button>
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
