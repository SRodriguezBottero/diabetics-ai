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

    const swUrl = `/firebase-messaging-sw.js?${configParams.toString()}`
    
    const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
    if (existingRegistration) {
      return existingRegistration
    }

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/firebase-messaging-sw.js',
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

  getFirebaseMessaging().then((messaging) => {
    if (messaging) {
      onMessage(messaging, callback)
    }
  })

  return () => {}
}
