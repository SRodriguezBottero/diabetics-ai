import { useState, useEffect } from 'react'
import Link from 'next/link'

interface UsageInfo {
  chatMessagesUsed: number
  chatMessagesLimit: number
  insightsUsed: number
  insightsLimit: number
  mealsClassifiedUsed: number
  mealsClassifiedLimit: number
  isPremium: boolean
  subscriptionStatus: string
}

export default function UsageMeter() {
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/subscription')
        if (res.ok) {
          const data = await res.json()
          setUsage(data)
        }
      } catch (error) {
        console.error('Error fetching usage:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [])

  if (loading || !usage) {
    return null
  }

  if (usage.isPremium) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              ⭐ Premium
            </span>
            <span className="text-sm text-emerald-700">Uso ilimitado</span>
          </div>
          <Link
            href="/pricing"
            className="text-sm text-emerald-600 hover:text-emerald-800"
          >
            Administrar →
          </Link>
        </div>
      </div>
    )
  }

  const totalUsed = usage.chatMessagesUsed + usage.insightsUsed + usage.mealsClassifiedUsed
  const totalLimit = usage.chatMessagesLimit + usage.insightsLimit + usage.mealsClassifiedLimit
  const overallPercentage = Math.min((totalUsed / totalLimit) * 100, 100)
  const isNearLimit = overallPercentage >= 70

  return (
    <div className={`rounded-lg p-4 ${isNearLimit ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Plan Gratuito
          </span>
          {isNearLimit && (
            <span className="text-xs text-amber-600 font-medium">
              Cerca del límite
            </span>
          )}
        </div>
        <Link
          href="/pricing"
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Actualizar a Premium →
        </Link>
      </div>

      <div className="space-y-2">
        <UsageBar
          label="Chat"
          used={usage.chatMessagesUsed}
          limit={usage.chatMessagesLimit}
        />
        <UsageBar
          label="Análisis AI"
          used={usage.insightsUsed}
          limit={usage.insightsLimit}
        />
        <UsageBar
          label="Comidas"
          used={usage.mealsClassifiedUsed}
          limit={usage.mealsClassifiedLimit}
        />
      </div>
    </div>
  )
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = Math.min((used / limit) * 100, 100)
  const remaining = limit - used
  const isExhausted = remaining <= 0
  const isLow = remaining <= 2 && remaining > 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isExhausted ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs w-8 text-right ${isExhausted ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-500'}`}>
        {remaining}
      </span>
    </div>
  )
}
