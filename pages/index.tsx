import { useState, useEffect } from 'react'
import ChatInterface from '../components/ChatInterface'
import RecentReadings from '../components/RecentReadings'
import HistoryChart from '../components/HistoryChart'
import AIInsights from '../components/AIInsights'
import ExportData from '../components/ExportData'
import ShareWithDoctor from '../components/ShareWithDoctor'
import MealClassifier from '../components/MealClassifier'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const [value, setValue] = useState('')
  const [userId, setUserId] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  /* ─── genera / recupera userId ─── */
  useEffect(() => {
    let id = localStorage.getItem('userId')
    if (!id) {
      id = uuidv4()
      localStorage.setItem('userId', id)
    }
    setUserId(id)
  }, [])

  /* ─── guarda la lectura ─── */
  const addReading = async () => {
    const val = parseFloat(value)
    if (isNaN(val)) return
    await fetch('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: val, userId }),
    })
    setValue('')
    setToast(`Registrado: ${val} mg/dL`)
    setTimeout(() => setToast(null), 3000)
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white py-6 px-2 sm:py-10 sm:px-4 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-700 text-center mb-2 sm:mb-0">
          Diabetics-AI
        </h1>
        {/* Card: Añadir + Chat */}
        <section className="bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">Añadir nueva medición</h2>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                placeholder="Nivel de glucosa"
                className="flex-1 border-gray-300 rounded-md px-3 py-3 text-base sm:text-sm w-full sm:w-auto"
                value={value}
                onChange={e => setValue(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500">mg/dL</span>
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 sm:py-2 rounded-md w-full sm:w-auto font-semibold"
                  onClick={addReading}
                >
                  + Añadir
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-semibold">Habla conmigo</h2>
            <ChatInterface userId={userId} />
          </div>
        </section>

        {/* Card: Mediciones recientes */}
        <RecentReadings userId={userId} />
        <HistoryChart userId={userId} />
        <AIInsights userId={userId} />
        <ExportData userId={userId} />
        <ShareWithDoctor userId={userId} />
        <MealClassifier />
      </div>
      {/* Toast/Snackbar */}
      {toast && (
        <div className="fixed left-1/2 bottom-8 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
} 