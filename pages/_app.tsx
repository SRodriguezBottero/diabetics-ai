import '../styles/globals.css'
import Reminder from '../components/Reminder'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
      })
    }
  }, [])
  return <>
    <Reminder />
    <Component {...pageProps}/>
  </>
}