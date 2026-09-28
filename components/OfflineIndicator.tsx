import { useState, useEffect } from 'react'

interface SyncStatus {
  pendingCount: number
  lastSync: Date | null
}

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ pendingCount: 0, lastSync: null })
  const [justCameOnline, setJustCameOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    setShowBanner(!navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setJustCameOnline(true)
      triggerSync()
      
      setTimeout(() => {
        setShowBanner(false)
        setJustCameOnline(false)
      }, 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    const handleSyncMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        setSyncStatus(prev => ({ ...prev, pendingCount: 0, lastSync: new Date() }))
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    navigator.serviceWorker?.addEventListener('message', handleSyncMessage)

    checkPendingSync()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleSyncMessage)
    }
  }, [])

  const checkPendingSync = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data?.pendingCount !== undefined) {
          setSyncStatus(prev => ({ ...prev, pendingCount: event.data.pendingCount }))
        }
      }

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_PENDING_SYNC' },
        [messageChannel.port2]
      )
    }
  }

  const triggerSync = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if ('sync' in registration) {
          await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-readings')
        } else {
          window.location.reload()
        }
      } catch {
        console.log('Background sync not supported, falling back to manual sync')
        window.location.reload()
      }
    }
  }

  if (!showBanner && syncStatus.pendingCount === 0) return null

  return (
    <>
      {showBanner && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isOnline && justCameOnline
              ? 'bg-emerald-500'
              : 'bg-amber-500'
          }`}
        >
          <div className="max-w-3xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline && justCameOnline ? (
                  <>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white text-sm font-medium">
                      ¡Conexión restaurada! Sincronizando datos...
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                    </svg>
                    <span className="text-white text-sm font-medium">
                      Sin conexión - Los datos se guardarán localmente
                    </span>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setShowBanner(false)}
                className="text-white/80 hover:text-white p-1"
                aria-label="Cerrar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {syncStatus.pendingCount > 0 && (
        <div className="fixed bottom-20 right-4 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-40">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">
            {syncStatus.pendingCount} lectura{syncStatus.pendingCount !== 1 ? 's' : ''} pendiente{syncStatus.pendingCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </>
  )
}
