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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement)

export default function History() {
  const [log, setLog] = useState<number[]>([])
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('glycemia') || '[]')
    setLog(saved)
  }, [])

  const data = {
    labels: log.map((_, i) => `Dato ${i+1}`),
    datasets: [{ label: 'Glicemia (mg/dL)', data: log, fill: false, tension: 0.3 }],
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-xl font-bold">Historial de controles</h1>
      {log.length
        ? <Line data={data} />
        : <p className="mt-4">Aún no hay datos.</p>
      }
    </div>
  )
}