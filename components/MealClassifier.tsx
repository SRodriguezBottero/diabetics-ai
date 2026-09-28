import { useState } from 'react'
import Link from 'next/link'

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
  | { label: 'desconocido' }

export default function MealClassifier() {
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

      /* ─── Generar sugerencia amigable si el backend no envía una ─── */
      if (data.label !== 'desconocido' && !data.suggestion) {
        const highFat = data.fat && data.fat > 20
        const highCarb = data.carbs && data.carbs > 60

        data.suggestion = (() => {
          if (highCarb) {
            return (
              'Este plato es alto en carbohidratos. ' +
              'Ejemplos para equilibrarlo: añade 1 pechuga de pollo a la plancha ' +
              'o un puñado de garbanzos y una ensalada verde (fibra) para evitar picos de glucosa.'
            )
          }
          if (highFat) {
            return (
              'Tiene bastante grasa. ' +
              'Prueba acompañarlo con vegetales al vapor o una ensalada de hojas frescas para aligerarlo.'
            )
          }
          return 'Porción equilibrada. Puedes acompañarla con agua o una infusión sin azúcar. ¡Buen provecho!'
        })()
      }
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

      {!loading && limitReached && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">{limitMessage}</p>
          <Link
            href="/pricing"
            className="inline-block mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-800"
          >
            Actualizar a Premium →
          </Link>
        </div>
      )}

      {!loading && !limitReached && result && (
        <div className="mt-4 text-sm">
          {result.label !== 'desconocido' ? (
            <div className="space-y-1">
              <p>
                Esta porción parece <b>{result.label}</b>
                {('confidence' in result && result.confidence) && <> ({result.confidence})</>}
              </p>

              {/* Tabla de macronutrientes */}
              <table className="text-xs">
                <tbody>
                  <tr>
                    <td className="pr-2">Carbs:</td>
                    <td>{('carbs' in result ? result.carbs : '—')} g</td>
                  </tr>
                  <tr>
                    <td className="pr-2">Proteína:</td>
                    <td>{('protein' in result ? result.protein : '—')} g</td>
                  </tr>
                  <tr>
                    <td className="pr-2">Grasa:</td>
                    <td>{('fat' in result ? result.fat : '—')} g</td>
                  </tr>
                  <tr>
                    <td className="pr-2">Fibra:</td>
                    <td>{('fiber' in result ? result.fiber : '—')} g</td>
                  </tr>
                </tbody>
              </table>

              {/* Sugerencia nutricional */}
              {'suggestion' in result && result.suggestion && (
                <p className="mt-1 italic text-emerald-700">{result.suggestion}</p>
              )}
            </div>
          ) : (
            <p>No pude reconocer la comida 🙁</p>
          )}
        </div>
      )}
    </div>
  )
}