import { useEffect, useState } from 'react'

type PredictionResponse =
  | { message: string }
  | { predicted: number; alert: 'low' | 'high' | null; advice?: string }

export default function GlucosePrediction({ userId }: { userId: string }) {
  const [data, setData] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetch(`/api/predict?userId=${userId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ message: 'Error al obtener la predicción.' }))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <section className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-500">Calculando predicción...</p>
      </section>
    )
  }

  if (!data) return null

  if ('message' in data) {
    return (
      <section className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-500">{data.message}</p>
      </section>
    )
  }

  const alertColor = data.alert
    ? 'bg-red-100 border-red-300 text-red-700'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700'

  const alertLabel = data.alert === 'low'
    ? 'Posible hipoglucemia'
    : data.alert === 'high'
    ? 'Posible hiperglucemia'
    : null

  return (
    <section className={`shadow-md rounded-lg p-6 border ${alertColor}`}>
      <h2 className="text-lg font-semibold mb-2">Predicción a corto plazo</h2>
      <p>
        En 30 minutos se estima: <b>{data.predicted.toFixed(0)} mg/dL</b>
        {alertLabel && <> – {alertLabel}</>}
      </p>
      {data.advice && <p className="mt-2 italic">{data.advice}</p>}
    </section>
  )
}
