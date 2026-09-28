import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'

export default function RecentReadings() {
  const { t } = useTranslation('common')
  const { locale } = useRouter()
  const [items, setItems] = useState<
    { value: number; timestamp: string }[]
  >([])

  useEffect(() => {
    fetch('/api/readings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data)
      })
  }, [])

  if (!items.length) return null

  const dateLocale = locale === 'en' ? enUS : es

  return (
    <section className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">{t('readings.recent')}</h2>
      <ul className="divide-y divide-gray-200">
        {items
          .slice(-5)
          .reverse()
          .map((r, i) => (
            <li key={i} className="py-2 flex justify-between text-sm">
              <span className="font-medium text-indigo-700">{r.value} mg/dL</span>
              <span className="text-gray-500">
                {format(new Date(r.timestamp), 'PPPP, p', { locale: dateLocale })}
              </span>
            </li>
          ))}
      </ul>
    </section>
  )
}
