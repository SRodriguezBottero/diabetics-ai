import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'

type MealResult =
  | {
      label: string
      carbs: number | null
      protein?: number | null
      fat?: number | null
      fiber?: number | null
      confidence?: string
      suggestion?: string
      limitReached?: boolean
      message?: string
    }
  | { label: 'desconocido' | 'unknown' }

export default function MealClassifier() {
  const { t } = useTranslation('common')
  const { locale } = useRouter()
  const [result, setResult] = useState<MealResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [limitMessage, setLimitMessage] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]

    setLoading(true)
    setResult(null)
    setLimitReached(false)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('locale', locale || 'es')

    try {
      const res = await fetch('/api/classify_meal', { method: 'POST', body: formData })
      const data = await res.json()
      
      if (data.limitReached) {
        setLimitReached(true)
        setLimitMessage(data.message || 'Has alcanzado tu límite mensual')
        setLoading(false)
        return
      }
      
      setResult(data)

      const unknownLabels = ['desconocido', 'unknown']
      if (!unknownLabels.includes(data.label) && !data.suggestion) {
        const highFat = data.fat && data.fat > 20
        const highCarb = data.carbs && data.carbs > 60

        data.suggestion = (() => {
          if (highCarb) {
            return t('mealClassifier.suggestionHighCarb')
          }
          if (highFat) {
            return t('mealClassifier.suggestionHighFat')
          }
          return t('mealClassifier.suggestionBalanced')
        })()
      }
    } catch (err) {
      console.error(err)
      setResult({ label: locale === 'en' ? 'unknown' : 'desconocido' })
    } finally {
      setLoading(false)
    }
  }

  const isUnknown = result && ['desconocido', 'unknown'].includes(result.label)

  return (
    <div>
      <h2 className="text-base sm:text-lg font-semibold mb-3">{t('mealClassifier.title')}</h2>
      <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
        ⚠️ {t('ai.disclaimer')}
      </div>

      <label htmlFor="meal-photo" className="block text-sm font-medium text-gray-700 mb-2">
        {t('mealClassifier.fileLabel')}
      </label>
      <input
        id="meal-photo"
        className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-700 file:text-white hover:file:bg-emerald-800"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        aria-label={t('mealClassifier.fileLabel')}
      />

      {loading && <p className="mt-4 text-sm text-gray-500">{t('mealClassifier.analyzing')}</p>}

      {!loading && limitReached && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-900 text-sm">{limitMessage}</p>
          <Link
            href="/pricing"
            className="inline-block mt-2 text-sm font-medium text-emerald-800 hover:text-emerald-900 underline"
          >
            Actualizar a Premium →
          </Link>
        </div>
      )}

      {!loading && !limitReached && result && (
        <div className="mt-4 text-sm">
          {!isUnknown ? (
            <div className="space-y-1">
              <p>
                {t('mealClassifier.portionLooksLike')} <b>{result.label}</b>
                {('confidence' in result && result.confidence) && <> ({result.confidence})</>}
              </p>

              <table className="text-xs">
                <tbody>
                  <tr>
                    <td className="pr-2">{t('mealClassifier.carbs')}</td>
                    <td>{('carbs' in result ? result.carbs : '—')} g</td>
                  </tr>
                  <tr>
                    <td className="pr-2">{t('mealClassifier.protein')}</td>
                    <td>{('protein' in result ? result.protein : '—')} g</td>
                  </tr>
                  <tr>
                    <td className="pr-2">{t('mealClassifier.fat')}</td>
                    <td>{('fat' in result ? result.fat : '—')} g</td>
                  </tr>
                  <tr>
                    <td className="pr-2">{t('mealClassifier.fiber')}</td>
                    <td>{('fiber' in result ? result.fiber : '—')} g</td>
                  </tr>
                </tbody>
              </table>

              {'suggestion' in result && result.suggestion && (
                <p className="mt-1 italic text-emerald-700">{result.suggestion}</p>
              )}
            </div>
          ) : (
            <p>{t('mealClassifier.unknown')}</p>
          )}
        </div>
      )}
    </div>
  )
}