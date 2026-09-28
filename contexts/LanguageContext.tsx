import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/router'

type Language = 'es' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'diabetics-ai-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [language, setLanguageState] = useState<Language>((router.locale as Language) || 'es')

  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
      if (savedLang !== router.locale) {
        router.push(router.pathname, router.asPath, { locale: savedLang })
      }
      setLanguageState(savedLang)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    router.push(router.pathname, router.asPath, { locale: lang })
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
