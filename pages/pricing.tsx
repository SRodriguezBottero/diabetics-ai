import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { FREE_TIER_LIMITS, PREMIUM_PRICE } from '../lib/subscription'

interface SubscriptionInfo {
  isPremium: boolean
  subscriptionStatus: string
  currentPeriodEnd: string | null
  chatMessagesUsed: number
  chatMessagesLimit: number
  insightsUsed: number
  insightsLimit: number
  mealsClassifiedUsed: number
  mealsClassifiedLimit: number
}

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (router.query.success === 'true') {
      setToast({ message: '¡Suscripción activada! Bienvenido a Premium.', type: 'success' })
      router.replace('/pricing', undefined, { shallow: true })
    } else if (router.query.canceled === 'true') {
      setToast({ message: 'Pago cancelado. No se realizó ningún cargo.', type: 'error' })
      router.replace('/pricing', undefined, { shallow: true })
    }
  }, [router, router.query])

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/subscription')
        if (res.ok) {
          const data = await res.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchSubscription()
    }
  }, [session])

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setToast({ message: 'Error al crear sesión de pago', type: 'error' })
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setToast({ message: 'Error al procesar el pago', type: 'error' })
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setToast({ message: 'Error al abrir portal de suscripción', type: 'error' })
      }
    } catch (error) {
      console.error('Portal error:', error)
      setToast({ message: 'Error al acceder al portal', type: 'error' })
    } finally {
      setPortalLoading(false)
    }
  }

  const isPremium = subscription?.isPremium

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white py-10 px-4">
      <Head>
        <title>Diabetics-AI | Planes</title>
      </Head>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-indigo-700 hover:text-indigo-900 mb-6 inline-block underline">
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-extrabold text-indigo-700 text-center mb-2">
          Planes y Precios
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Elige el plan que mejor se adapte a tus necesidades
        </p>

        {loading ? (
          <div className="text-center text-gray-500">Cargando...</div>
        ) : (
          <>
            {/* Current Plan Status */}
            {subscription && (
              <div className="mb-8 p-4 bg-white rounded-lg shadow-md text-center">
                <p className="text-gray-600">
                  Tu plan actual:{' '}
                  <span className={`font-bold ${isPremium ? 'text-emerald-800' : 'text-gray-800'}`}>
                    {isPremium ? 'Premium' : 'Gratuito'}
                  </span>
                </p>
                {isPremium && subscription.currentPeriodEnd && (
                  <p className="text-sm text-gray-500 mt-1">
                    Próxima renovación: {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            )}

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Tier */}
              <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${!isPremium ? 'border-indigo-500' : 'border-gray-200'}`}>
                {!isPremium && (
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded mb-4">
                    Plan actual
                  </span>
                )}
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Gratuito</h2>
                <p className="text-4xl font-extrabold text-gray-900 mb-4">
                  $0<span className="text-lg font-normal text-gray-500">/mes</span>
                </p>
                
                <ul className="space-y-3 mb-6">
                  <PricingFeature included>{FREE_TIER_LIMITS.chatMessages} mensajes de chat/mes</PricingFeature>
                  <PricingFeature included>{FREE_TIER_LIMITS.insights} análisis AI/mes</PricingFeature>
                  <PricingFeature included>{FREE_TIER_LIMITS.mealsClassified} clasificaciones de comida/mes</PricingFeature>
                  <PricingFeature included>Seguimiento de glucosa ilimitado</PricingFeature>
                  <PricingFeature>Exportar PDF para doctores</PricingFeature>
                  <PricingFeature>Soporte prioritario</PricingFeature>
                </ul>

                {!isPremium && (
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Plan actual
                  </button>
                )}
              </div>

              {/* Premium Tier */}
              <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${isPremium ? 'border-emerald-500' : 'border-gray-200'} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Recomendado
                </div>
                {isPremium && (
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-1 rounded mb-4">
                    Plan actual
                  </span>
                )}
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Premium</h2>
                <p className="text-4xl font-extrabold text-gray-900 mb-4">
                  ${PREMIUM_PRICE}<span className="text-lg font-normal text-gray-500">/mes</span>
                </p>
                
                <ul className="space-y-3 mb-6">
                  <PricingFeature included>Mensajes de chat ilimitados</PricingFeature>
                  <PricingFeature included>Análisis AI ilimitados</PricingFeature>
                  <PricingFeature included>Clasificaciones de comida ilimitadas</PricingFeature>
                  <PricingFeature included>Seguimiento de glucosa ilimitado</PricingFeature>
                  <PricingFeature included>Exportar PDF para doctores</PricingFeature>
                  <PricingFeature included>Soporte prioritario</PricingFeature>
                </ul>

                {isPremium ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {portalLoading ? 'Cargando...' : 'Administrar suscripción'}
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {checkoutLoading ? 'Procesando...' : 'Actualizar a Premium'}
                  </button>
                )}
              </div>
            </div>

            {/* Usage Stats for Free Users */}
            {!isPremium && subscription && (
              <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Tu uso este mes</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <UsageStat
                    label="Mensajes de chat"
                    used={subscription.chatMessagesUsed}
                    limit={FREE_TIER_LIMITS.chatMessages}
                  />
                  <UsageStat
                    label="Análisis AI"
                    used={subscription.insightsUsed}
                    limit={FREE_TIER_LIMITS.insights}
                  />
                  <UsageStat
                    label="Clasificaciones"
                    used={subscription.mealsClassifiedUsed}
                    limit={FREE_TIER_LIMITS.mealsClassified}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Toast */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
              toast.type === 'success' ? 'bg-emerald-800 text-white' : 'bg-red-700 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  )
}

function PricingFeature({ children, included = false }: { children: React.ReactNode; included?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      {included ? (
        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={included ? 'text-gray-700' : 'text-gray-400'}>{children}</span>
    </li>
  )
}

function UsageStat({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = Math.min((used / limit) * 100, 100)
  const isNearLimit = percentage >= 80

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={isNearLimit ? 'text-amber-600 font-medium' : 'text-gray-500'}>
          {used}/{limit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
