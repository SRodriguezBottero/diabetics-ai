import '../styles/globals.css'
import Reminder from '../components/Reminder'
import PWAInstallPrompt from '../components/PWAInstallPrompt'
import OfflineIndicator from '../components/OfflineIndicator'
import ServiceWorkerUpdater from '../components/ServiceWorkerUpdater'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

const publicPages = ['/login', '/pricing']

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
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
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!session && !isPublicPage) {
    return null
  }

  return <>{children}</>
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ServiceWorkerUpdater />
      <OfflineIndicator />
      <AuthGuard>
        <Reminder />
        <Component {...pageProps} />
      </AuthGuard>
      <PWAInstallPrompt />
    </SessionProvider>
  )
}
