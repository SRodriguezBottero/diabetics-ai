import { useState, useEffect } from 'react'

export default function ServiceWorkerUpdater() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker)
              setShowUpdatePrompt(true)
            }
          })
        })

        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting)
          setShowUpdatePrompt(true)
        }

        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Check for updates every hour

      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    }

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })

    registerSW()
  }, [])

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    setShowUpdatePrompt(false)
  }

  const handleDismiss = () => {
    setShowUpdatePrompt(false)
  }

  if (!showUpdatePrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-indigo-600 text-white rounded-xl shadow-2xl p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Nueva versión disponible</h3>
          <p className="text-sm text-indigo-100 mb-3">
            Actualiza para obtener las últimas mejoras
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-white text-indigo-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Actualizar
            </button>
            <button
              onClick={handleDismiss}
              className="text-sm text-indigo-200 hover:text-white py-2 px-3 transition-colors"
            >
              Luego
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
