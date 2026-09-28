import '../styles/globals.css'
import Reminder from '../components/Reminder'
import PWAInstallPrompt from '../components/PWAInstallPrompt'
import OfflineIndicator from '../components/OfflineIndicator'
import ServiceWorkerUpdater from '../components/ServiceWorkerUpdater'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <ServiceWorkerUpdater />
      <OfflineIndicator />
      <Reminder />
      <Component {...pageProps} />
      <PWAInstallPrompt />
    </>
  )
}
