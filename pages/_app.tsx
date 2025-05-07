import Reminder from '../components/Reminder'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Reminder />
    <Component {...pageProps}/>
  </>
}