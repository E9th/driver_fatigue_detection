import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getDatabase, type Database } from "firebase-admin/database"

let adminApp: App | null = null
let adminAuth: Auth | null = null
let adminDb: Database | null = null

function initializeFirebaseAdmin() {
  if (adminApp) {
    return { adminApp, adminAuth: adminAuth!, adminDb: adminDb! }
  }

  try {
    // Check if environment variables are available
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

    if (!projectId || !clientEmail || !privateKey) {
      console.warn("⚠️ Firebase Admin: Missing environment variables, admin features will be disabled")
      return { adminApp: null, adminAuth: null, adminDb: null }
    }

    // Initialize Firebase Admin
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      })
    } else {
      adminApp = getApps()[0]
    }

    adminAuth = getAuth(adminApp)
    adminDb = getDatabase(adminApp)

    console.log("✅ Firebase Admin: Initialized successfully")
    return { adminApp, adminAuth, adminDb }
  } catch (error) {
    console.error("❌ Firebase Admin: Initialization failed:", error)
    return { adminApp: null, adminAuth: null, adminDb: null }
  }
}

// Lazy getters
export function getAdminAuth(): Auth | null {
  if (!adminAuth) {
    const { adminAuth: auth } = initializeFirebaseAdmin()
    return auth
  }
  return adminAuth
}

export function getAdminDb(): Database | null {
  if (!adminDb) {
    const { adminDb: db } = initializeFirebaseAdmin()
    return db
  }
  return adminDb
}

// Export the instances (will be null if not configured)
const { adminApp: app, adminAuth: auth, adminDb: db } = initializeFirebaseAdmin()

export { app as adminApp, auth as adminAuth, db as adminDb }
export default app
