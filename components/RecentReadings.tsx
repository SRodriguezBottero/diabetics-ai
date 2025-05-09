import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function RecentReadings({ userId }: { userId: string }) {
  const [items, setItems] = useState<
    { value: number; timestamp: string }[]
  >([])

  useEffect(() => {
    fetch(`/api/readings?userId=${userId}`)
      .then(r => r.json())
      .then(setItems)
  }, [userId])

  if (!items.length) return null

  return (
    <section className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Mediciones recientes</h2>
      <ul className="divide-y divide-gray-200">
        {items
          .slice(-5)
          .reverse()
          .map((r, i) => (
            <li key={i} className="py-2 flex justify-between text-sm">
              <span className="font-medium text-indigo-700">{r.value} mg/dL</span>
              <span className="text-gray-500">
                {format(new Date(r.timestamp), 'PPPP, p', { locale: es })}
              </span>
            </li>
          ))}
      </ul>
    </section>
  )
}
