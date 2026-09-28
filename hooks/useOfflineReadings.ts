import { useState, useEffect, useCallback } from 'react'

interface Reading {
  id?: string
  value: number
  timestamp: string
  userId: string
  pending?: boolean
}

const READINGS_CACHE_KEY = 'diabetics-ai-readings-cache'

export function useOfflineReadings(userId: string) {
  const [readings, setReadings] = useState<Reading[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  const loadCachedReadings = useCallback(() => {
    try {
      const cached = localStorage.getItem(`${READINGS_CACHE_KEY}-${userId}`)
      if (cached) {
        return JSON.parse(cached) as Reading[]
      }
    } catch (error) {
      console.error('Failed to load cached readings:', error)
    }
    return []
  }, [userId])

  const saveCachedReadings = useCallback((data: Reading[]) => {
    try {
      localStorage.setItem(`${READINGS_CACHE_KEY}-${userId}`, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to cache readings:', error)
    }
  }, [userId])

  const fetchReadings = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/readings?userId=${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        setReadings(data)
        saveCachedReadings(data)
        setPendingCount(0)
      } else if (response.status === 503) {
        const cached = loadCachedReadings()
        setReadings(cached)
      }
    } catch (error) {
      console.log('Network error, using cached data')
      const cached = loadCachedReadings()
      setReadings(cached)
    } finally {
      setIsLoading(false)
    }
  }, [userId, loadCachedReadings, saveCachedReadings])

  const addReading = useCallback(async (value: number): Promise<boolean> => {
    const newReading: Reading = {
      id: `pending-${Date.now()}`,
      value,
      timestamp: new Date().toISOString(),
      userId,
      pending: true
    }

    setReadings(prev => {
      const updated = [...prev, newReading]
      saveCachedReadings(updated)
      return updated
    })

    try {
      const response = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, userId })
      })

      if (response.ok) {
        const savedReading = await response.json()
        setReadings(prev => {
          const updated = prev.map(r => 
            r.id === newReading.id ? { ...savedReading, pending: false } : r
          )
          saveCachedReadings(updated)
          return updated
        })
        return true
      } else if (response.status === 202) {
        setPendingCount(prev => prev + 1)
        return true
      }
    } catch (error) {
      console.log('Reading queued for offline sync')
      setPendingCount(prev => prev + 1)
      return true
    }

    return false
  }, [userId, saveCachedReadings])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      setIsOnline(true)
      fetchReadings()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    const handleSyncComplete = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        fetchReadings()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    navigator.serviceWorker?.addEventListener('message', handleSyncComplete)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleSyncComplete)
    }
  }, [fetchReadings])

  useEffect(() => {
    fetchReadings()
  }, [fetchReadings])

  return {
    readings,
    isLoading,
    isOnline,
    pendingCount,
    addReading,
    refetch: fetchReadings
  }
}
