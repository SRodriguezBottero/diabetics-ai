import { ReactNode } from 'react'
import Head from 'next/head'
import BottomNavigation from './BottomNavigation'

interface AppLayoutProps {
  children: ReactNode
  title?: string
  showNav?: boolean
}

export default function AppLayout({ children, title, showNav = true }: AppLayoutProps) {
  return (
    <div className="app-shell">
      {title && (
        <Head>
          <title>{title}</title>
        </Head>
      )}
      <main className={`app-content ${showNav ? 'pb-nav' : ''}`}>
        {children}
      </main>
      {showNav && <BottomNavigation />}
    </div>
  )
}
