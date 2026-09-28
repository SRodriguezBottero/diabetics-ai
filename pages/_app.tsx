import '../styles/globals.css'
import Reminder from '../components/Reminder'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

const publicPages = ['/login']

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
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
      })
    }
  }, [])

  return (
    <SessionProvider session={session}>
      <AuthGuard>
        <Reminder />
        <Component {...pageProps} />
      </AuthGuard>
    </SessionProvider>
  )
} 