import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getDatabase } from "firebase-admin/database"

let adminApp: any = null
let isInitialized = false

function initializeFirebaseAdmin() {
  if (isInitialized) {
    return adminApp
  }

  // Check if required environment variables are available
  const hasRequiredEnvVars =
    process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY

  if (!hasRequiredEnvVars) {
    console.warn("Firebase Admin environment variables not configured")
    return null
  }

  try {
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }

    // Initialize Firebase Admin if not already initialized
    if (!getApps().length) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      })
    } else {
      adminApp = getApps()[0]
    }

    isInitialized = true
    return adminApp
  } catch (error) {
    console.warn("Firebase Admin initialization failed:", error)
    return null
  }
}

export async function auth() {
  const app = initializeFirebaseAdmin()
  if (!app) {
    throw new Error("Firebase Admin not initialized")
  }
  return getAuth(app)
}

export async function database() {
  const app = initializeFirebaseAdmin()
  if (!app) {
    throw new Error("Firebase Admin not initialized")
  }
  return getDatabase(app)
}
