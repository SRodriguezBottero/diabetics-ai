import { useState, useEffect } from 'react'
import ChatInterface from '../components/ChatInterface'

export default function Home() {
  const [value, setValue] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    let id = localStorage.getItem('userId')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('userId', id)
    }
    setUserId(id)
  }, [])

  const addReading = async () => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    await fetch('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: num, userId })
    })
    setValue('')
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); addReading() }} className="flex space-x-2">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="mg/dL"
          className="flex-1 border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 rounded">
          Añadir
        </button>
      </form>
      <ChatInterface userId={userId} />
    </div>
  )
}
