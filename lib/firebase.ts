import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | undefined
let messaging: Messaging | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return app
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null
  
  const supported = await isSupported()
  if (!supported) return null

  if (!messaging) {
    const app = getFirebaseApp()
    messaging = getMessaging(app)
  }
  return messaging
}

async function registerFirebaseServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const configParams = new URLSearchParams({
      apiKey: firebaseConfig.apiKey || '',
      authDomain: firebaseConfig.authDomain || '',
      projectId: firebaseConfig.projectId || '',
      storageBucket: firebaseConfig.storageBucket || '',
      messagingSenderId: firebaseConfig.messagingSenderId || '',
      appId: firebaseConfig.appId || '',
    })

    // Dedicated FCM scope so this does not fight the PWA /sw.js on "/"
    const swScope = '/firebase-cloud-messaging-push-scope'
    const swUrl = `/firebase-messaging-sw.js?${configParams.toString()}`

    const existingRegistration = await navigator.serviceWorker.getRegistration(swScope)
    if (existingRegistration?.active?.scriptURL.includes('firebase-messaging-sw.js')) {
      return existingRegistration
    }

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: swScope,
    })

    await navigator.serviceWorker.ready

    return registration
  } catch (error) {
    console.error('Failed to register Firebase messaging service worker:', error)
    return null
  }
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null
    
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    const messaging = await getFirebaseMessaging()
    if (!messaging) return null

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('VAPID key not configured')
      return null
    }

    const swRegistration = await registerFirebaseServiceWorker()
    
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration || undefined,
    })

    return token
  } catch (error) {
    console.error('Error getting notification permission:', error)
    return null
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void): (() => void) | null {
  if (typeof window === 'undefined') return null

  let unsubscribe: (() => void) | undefined

  getFirebaseMessaging().then((messaging) => {
    if (!messaging) return

    unsubscribe = onMessage(messaging, (payload) => {
      callback(payload)

      // FCM does not show a system banner while the tab is focused — do it ourselves.
      const title = payload.notification?.title || 'Diabetics-AI'
      const body = payload.notification?.body || ''
      if (Notification.permission === 'granted' && (title || body)) {
        new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          data: payload.data,
        })
      }
    })
  })

  return () => {
    unsubscribe?.()
  }
}
