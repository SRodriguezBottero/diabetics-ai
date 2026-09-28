import '../styles/globals.css'
import Reminder from '../components/Reminder'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { appWithTranslation } from 'next-i18next/pages'
import { useTranslation } from 'react-i18next'
import { LanguageProvider } from '../contexts/LanguageContext'

const publicPages = ['/login']

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation('common')
  const isPublicPage = publicPages.includes(router.pathname)

  useEffect(() => {
    if (status === 'loading') return
    if (!session && !isPublicPage) {
      router.push('/login')
    }
  }, [session, status, isPublicPage, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">{t('app.loading')}</div>
      </div>
    )
  }

  if (!session && !isPublicPage) {
    return null
  }

  return <>{children}</>
}

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
      })
    }
  }, [])

  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        <AuthGuard>
          <Reminder />
          <Component {...pageProps} />
        </AuthGuard>
      </LanguageProvider>
    </SessionProvider>
  )
}

export default appWithTranslation(App) 