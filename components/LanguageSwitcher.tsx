import { useLanguage } from '../contexts/LanguageContext'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation('common')

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 hidden sm:inline">{t('language.switch')}:</span>
      <div className="flex rounded-md overflow-hidden border border-gray-300">
        <button
          onClick={() => setLanguage('es')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'es'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          ES
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  )
}
