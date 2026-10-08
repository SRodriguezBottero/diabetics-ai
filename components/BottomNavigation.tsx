import { useRouter } from 'next/router'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

interface Tab {
  path: string
  labelKey: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  {
    path: '/',
    labelKey: 'nav.home',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    path: '/history',
    labelKey: 'nav.history',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    path: '/ai',
    labelKey: 'nav.ai',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    path: '/profile',
    labelKey: 'nav.profile',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

export default function BottomNavigation() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const currentPath = router.pathname

  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200"
      role="navigation"
      aria-label={t('nav.ariaLabel')}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto h-16">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`bottom-nav-item flex flex-col items-center justify-center flex-1 relative ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500'
              }`}
              aria-current={isActive ? 'page' : undefined}
              draggable={false}
            >
              <span
                className={`transition-transform duration-150 ease-out ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
              >
                {tab.icon}
              </span>
              <span className="text-xs mt-1 font-medium">{t(tab.labelKey)}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-indigo-600 rounded-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </div>
      <div className="safe-area-bottom" aria-hidden="true" />
    </nav>
  )
}
