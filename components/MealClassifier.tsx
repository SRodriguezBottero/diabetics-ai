import { useState } from 'react'

type MealResult =
  | { label: string; carbs: number | null; confidence?: string }
  | { label: 'desconocido' }

export default function MealClassifier() {
  const [result, setResult] = useState<MealResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch('/api/classify_meal', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
      setResult({ label: 'desconocido' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="my-6 p-4 bg-white rounded-lg shadow-md">
      <h2 className="font-bold mb-3">Reconocimiento de comida</h2>

      <input
        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />

      {loading && <p className="mt-4 text-sm text-gray-500">Analizando imagen…</p>}

      {!loading && result && (
        <div className="mt-4 text-sm">
          {result.label !== 'desconocido' ? (
            <p>
              Esta porción parece <b>{result.label}</b>
              {'carbs' in result && result.carbs != null && (
                <>
                  : &nbsp;~<b>{result.carbs}</b> g carbs
                </>
              )}
              {'confidence' in result && result.confidence && (
                <> ({result.confidence} confiabilidad)</>
              )}
            </p>
          ) : (
            <p>No pude reconocer la comida 🙁</p>
          )}
        </div>
      )}
    </div>
  )
}