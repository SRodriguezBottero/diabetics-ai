// pages/history.tsx
import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js'
import { useTranslation } from 'react-i18next'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { GetStaticProps } from 'next'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement)

export default function History() {
  const { t } = useTranslation('common')
  const [log, setLog] = useState<number[]>([])
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('glycemia') || '[]')
    setLog(saved)
  }, [])

  const data = {
    labels: log.map((_, i) => t('history.dataPoint', { index: i + 1 })),
    datasets: [{ label: t('history.glucoseLabel'), data: log, fill: false, tension: 0.3 }],
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-xl font-bold">{t('history.pageTitle')}</h1>
      {log.length
        ? <Line data={data} />
        : <p className="mt-4">{t('history.noDataPage')}</p>
      }
    </div>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'es', ['common'])),
  },
})