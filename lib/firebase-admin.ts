import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getMessaging, Message, MulticastMessage, BatchResponse } from 'firebase-admin/messaging'

function getFirebaseAdmin(): App {
  const existingApps = getApps()
  if (existingApps.length > 0) {
    return existingApps[0]
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set')
  }

  try {
    const parsedServiceAccount = JSON.parse(serviceAccount)
    
    return initializeApp({
      credential: cert(parsedServiceAccount),
    })
  } catch (error) {
    throw new Error(`Failed to parse Firebase service account key: ${error}`)
  }
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string> {
  const app = getFirebaseAdmin()
  const messaging = getMessaging(app)
  
  const message: Message = {
    token,
    notification: {
      title,
      body,
    },
    webpush: {
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
      },
      fcmOptions: {
        link: '/',
      },
    },
    data,
  }

  return messaging.send(message)
}

export async function sendMultiplePushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<BatchResponse> {
  if (tokens.length === 0) {
    return { responses: [], successCount: 0, failureCount: 0 }
  }

  const app = getFirebaseAdmin()
  const messaging = getMessaging(app)
  
  const message: MulticastMessage = {
    tokens,
    notification: {
      title,
      body,
    },
    webpush: {
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
      },
      fcmOptions: {
        link: '/',
      },
    },
    data,
  }

  return messaging.sendEachForMulticast(message)
}

export { getFirebaseAdmin }
