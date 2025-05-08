import { useState, useEffect } from 'react'
import ChatInterface from '../components/ChatInterface'
import RecentReadings from '../components/RecentReadings'

export default function Home() {
  const [value, setValue] = useState('')
  const [userId, setUserId] = useState('')

  /* ─── genera / recupera userId ─── */
  useEffect(() => {
    let id = localStorage.getItem('userId')
    if (!id) {
      id = crypto.randomUUID()
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
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-indigo-700">Diabetics-AI</h1>
      <div className="max-w-xl space-y-6">
        {/* ───────── Añadir medición ───────── */}
        <section className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Añadir nueva medición</h2>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Nivel de glucosa"
              className="flex-1 rounded-md border-gray-300"
              value={value}
              onChange={e => setValue(e.target.value)}
            />
            <span className="text-sm text-gray-500">mg/dL</span>
            <button
              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md px-3 py-2"
              onClick={addReading}
            >
              <span className="text-lg leading-none">＋</span> Añadir
            </button>
          </div>

          {/* ───────── Chat ───────── */}
          <h2 className="text-lg font-semibold mt-4">Habla conmigo</h2>
          <ChatInterface userId={userId} />
        </section>
        {/* ───────── Lista de lecturas ───────── */}
        <RecentReadings userId={userId} />
      </div>
      </div>
    </div>
  )
}
