import { useLanguage } from '../contexts/LanguageContext'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation('common')

  return (
    <div className="flex items-center gap-2" role="group" aria-label={t('language.groupLabel')}>
      <span className="text-sm text-gray-600 hidden sm:inline" id="language-switch-label">
        {t('language.switch')}:
      </span>
      <div className="flex rounded-md overflow-hidden border border-gray-300" aria-labelledby="language-switch-label">
        <button
          type="button"
          onClick={() => setLanguage('es')}
          aria-pressed={language === 'es'}
          aria-label={t('language.spanish')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'es'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          aria-pressed={language === 'en'}
          aria-label={t('language.english')}
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
