/**
 * Firebase Core Service
 * Handles Firebase initialization and core data operations with error recovery
 */

import { initializeApp, getApps } from "firebase/app"
import { getDatabase, ref, onValue, off, query, limitToLast, get, set } from "firebase/database"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { firebaseConfig } from "./config"
import type { DeviceData, HistoricalData } from "./types"

// Firebase instances
let app: any = null
let database: any = null
let auth: any = null

// Error recovery state
let initializationAttempts = 0
const MAX_INIT_ATTEMPTS = 3
let isInitializing = false

/**
 * Initialize Firebase with error handling and retry logic
 * Only runs on client side
 */
const initializeFirebase = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false

  if (isInitializing) {
    console.log("🔥 Firebase: Already initializing, waiting...")
    return false
  }

  isInitializing = true
  initializationAttempts++

  try {
    console.log(`🔥 Firebase: Initializing... (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})`)

    const existingApps = getApps()
    if (existingApps.length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = existingApps[0]
    }

    database = getDatabase(app)
    auth = getAuth(app)

    console.log("✅ Firebase: Initialized successfully")
    initializationAttempts = 0 // Reset on success
    isInitializing = false
    return true
  } catch (error) {
    console.error(`❌ Firebase initialization error (attempt ${initializationAttempts}):`, error)
    database = null
    auth = null
    isInitializing = false

    // Retry logic
    if (initializationAttempts < MAX_INIT_ATTEMPTS) {
      console.log(`🔄 Firebase: Retrying initialization in 2 seconds...`)
      setTimeout(() => initializeFirebase(), 2000)
    } else {
      console.error("❌ Firebase: Max initialization attempts reached, falling back to development mode")
    }
    return false
  }
}

// Initialize Firebase
initializeFirebase()

// Export Firebase instances
export { app, database, auth }

/**
 * Retry wrapper for Firebase operations
 */ \
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3)
: Promise<T | null> =>
{
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      console.error(`❌ Firebase operation failed (attempt ${attempt}/${maxRetries}):`, error)

      if (attempt === maxRetries) {
        console.error("❌ Firebase: Max retries reached, operation failed")
        return null
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
  return null
}

/**
 * Subscribe to real-time current device data with error recovery
 */
export const subscribeToCurrentData = (deviceId: string, callback: (data: DeviceData | null) => void): (() => void) => {
  if (!database) {
    console.warn("🔧 Firebase not available, no real-time data")
    if (typeof callback === "function") {
      callback(null)
    }
    return () => {}
  }

  if (typeof callback !== "function") {
    console.error(`❌ Firebase: Invalid callback provided to subscribeToCurrentData for ${deviceId}`)
    return () => {}
  }

  console.log(`🔥 Firebase: Subscribing to current data for ${deviceId}`)
  const currentDataRef = ref(database, `devices/${deviceId}/current_data`)

  try {
    onValue(
      currentDataRef,
      (snapshot) => {
        const data = snapshot.val()
        console.log(`🔥 Firebase: Current data received for ${deviceId}:`, data ? "✅ Data" : "❌ No data")
        callback(data)
      },
      (error) => {
        console.error(`❌ Firebase: Error subscribing to current data for ${deviceId}:`, error)
        callback(null)

        // Attempt to reinitialize Firebase on connection error
        if (error.code === "NETWORK_ERROR" || error.code === "PERMISSION_DENIED") {
          console.log("🔄 Firebase: Attempting to reinitialize due to connection error...")
          initializeFirebase()
        }
      },
    )
  } catch (error) {
    console.error(`❌ Firebase: Exception in subscribeToCurrentData for ${deviceId}:`, error)
    callback(null)
  }

  return () => {
    console.log(`🔥 Firebase: Unsubscribing from current data for ${deviceId}`)
    try {
      off(currentDataRef)
    } catch (error) {
      console.error("❌ Error unsubscribing:", error)
    }
  }
}

/**
 * Subscribe to historical device data with date filtering and error recovery
 */
export const subscribeToHistoricalData = (
  deviceId: string,
  startDate: string,
  endDate: string,
  callback: (data: HistoricalData[]) => void,
): (() => void) => {
  if (!database) {
    console.warn("🔧 Firebase not available, no historical data")
    if (typeof callback === "function") {
      callback([])
    }
    return () => {}
  }

  if (typeof callback !== "function") {
    console.error(`❌ Firebase: Invalid callback provided to subscribeToHistoricalData for ${deviceId}`)
    return () => {}
  }

  console.log(`🔥 Firebase: Subscribing to historical data for ${deviceId} (${startDate} to ${endDate})`)

  const historyRef = ref(database, `devices/${deviceId}/history`)
  const historyQuery = query(historyRef, limitToLast(200))

  try {
    onValue(
      historyQuery,
      (snapshot) => {
        const data = snapshot.val()
        console.log(
          `🔥 Firebase: Historical data received for ${deviceId}:`,
          data ? `✅ ${Object.keys(data).length} records` : "❌ No data",
        )

        if (data) {
          const historyArray = Object.entries(data).map(([id, item]: [string, any]) => ({
            id,
            timestamp: item.timestamp,
            ear_value: item.ear || 0,
            ear: item.ear || 0,
            yawn_events: item.yawn_events || 0,
            drowsiness_events: item.drowsiness_events || 0,
            critical_alerts: item.critical_alerts || 0,
            device_id: item.device_id || deviceId,
            status: item.status || "NORMAL",
            mouth_distance: item.mouth_distance || 0,
            face_detected_frames: item.face_detected_frames || 0,
          }))

          let filteredData = historyArray
          if (startDate && endDate) {
            const start = new Date(startDate).getTime()
            const end = new Date(endDate).getTime()
            filteredData = historyArray.filter((item) => {
              const itemTime = new Date(item.timestamp).getTime()
              return itemTime >= start && itemTime <= end
            })
          }

          filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          callback(filteredData)
        } else {
          callback([])
        }
      },
      (error) => {
        console.error(`❌ Firebase: Error subscribing to historical data for ${deviceId}:`, error)
        callback([])

        // Attempt to reinitialize Firebase on connection error
        if (error.code === "NETWORK_ERROR" || error.code === "PERMISSION_DENIED") {
          console.log("🔄 Firebase: Attempting to reinitialize due to connection error...")
          initializeFirebase()
        }
      },
    )
  } catch (error) {
    console.error(`❌ Firebase: Exception in subscribeToHistoricalData for ${deviceId}:`, error)
    callback([])
  }

  return () => {
    console.log(`🔥 Firebase: Unsubscribing from historical data for ${deviceId}`)
    try {
      off(historyQuery)
    } catch (error) {
      console.error("❌ Error unsubscribing:", error)
    }
  }
}

/**
 * Authentication functions with error recovery
 */
export const signIn = async (email: string, password: string) => {
  const result = await withRetry(async () => {
    if (!auth) {
      await initializeFirebase()
      if (!auth) throw new Error("Firebase Auth not available")
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  })

  return result || { success: false, error: "การเข้าสู่ระบบล้มเหลว" }
}

export const registerUser = async (userData: any) => {
  const result = await withRetry(async () => {
    if (!auth || !database) {
      await initializeFirebase()
      if (!auth || !database) throw new Error("Firebase not available")
    }

    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
    const uid = userCredential.user.uid

    const userProfile = {
      uid,
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone,
      license: userData.license,
      deviceId: userData.deviceId,
      role: userData.role || "driver",
      registeredAt: new Date().toISOString(),
    }

    await set(ref(database, `users/${uid}`), userProfile)
    return { success: true, user: userCredential.user }
  })

  return result || { success: false, error: "การลงทะเบียนล้มเหลว" }
}

export const signOut = async () => {
  const result = await withRetry(async () => {
    if (!auth) {
      await initializeFirebase()
      if (!auth) throw new Error("Firebase Auth not available")
    }

    await firebaseSignOut(auth)
    return { success: true }
  })

  return result || { success: false, error: "การออกจากระบบล้มเหลว" }
}

/**
 * Get used device IDs with error recovery
 */
export const getUsedDeviceIds = async (): Promise<string[]> => {
  if (!database) {
    console.log("🔧 Firebase not available, returning mock data")
    return ["01", "02", "03"]
  }

  const result = await withRetry(async () => {
    console.log("🔥 Firebase: Getting used device IDs")
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (snapshot.exists()) {
      const users = snapshot.val()
      const usedDevices = Object.values(users)
        .map((user: any) => {
          const deviceId = user.deviceId || user.device_id || ""
          return deviceId.replace("device_", "").padStart(2, "0")
        })
        .filter(Boolean)
        .filter((id) => id !== "null" && id !== "00")

      console.log("🔥 Firebase: Used devices:", usedDevices)
      return usedDevices
    } else {
      console.log("🔥 Firebase: No users found, no devices used")
      return []
    }
  })

  return result || ["01", "02", "03"]
}

/**
 * Check if email is already registered
 */
export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  if (!database) {
    console.log("🔧 Firebase not available")
    return true
  }

  const result = await withRetry(async () => {
    console.log(`🔥 Firebase: Checking email availability: ${email}`)
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (snapshot.exists()) {
      const users = snapshot.val()
      const emailExists = Object.values(users).some((user: any) => user.email === email)
      console.log(`🔥 Firebase: Email ${email} exists:`, emailExists)
      return !emailExists
    } else {
      console.log(`🔥 Firebase: No users found, email ${email} is available`)
      return true
    }
  })

  return result !== null ? result : true
}

/**
 * Utility functions for status and safety level calculations
 */
export const getStatusInThai = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    NORMAL: "ปกติ",
    "YAWN DETECTED": "หาว",
    "DROWSINESS DETECTED": "ง่วงนอน",
    "CRITICAL: EXTENDED DROWSINESS": "อันตราย",
    CRITICAL: "อันตราย",
  }
  return statusMap[status] || "ไม่ทราบสถานะ"
}

export const getSafetyLevel = (ear: number): { level: string; color: string; description: string } => {
  if (ear >= 0.25) {
    return { level: "ปลอดภัย", color: "text-green-600", description: "ตาเปิดปกติ" }
  } else if (ear >= 0.2) {
    return { level: "ระวัง", color: "text-yellow-600", description: "เริ่มง่วงเล็กน้อย" }
  } else if (ear >= 0.15) {
    return { level: "เสี่ยง", color: "text-orange-600", description: "ง่วงนอนมาก" }
  } else {
    return { level: "อันตราย", color: "text-red-600", description: "ง่วงนอนอย่างรุนแรง" }
  }
}

/**
 * Administrative functions for device and user management
 */
export const getDeviceCount = async (): Promise<number> => {
  const result = await withRetry(async () => {
    if (!database) return 0

    const devicesRef = ref(database, "devices")
    const snapshot = await get(devicesRef)

    if (snapshot.exists()) {
      const count = Object.keys(snapshot.val()).length
      console.log(`🔥 Firebase: Found ${count} total devices`)
      return count
    }
    return 0
  })

  return result || 0
}

export const getActiveDeviceCount = async (): Promise<number> => {
  const result = await withRetry(async () => {
    if (!database) return 0

    const devicesRef = ref(database, "devices")
    const snapshot = await get(devicesRef)

    if (snapshot.exists()) {
      const devices = snapshot.val()
      const now = Date.now()
      const fiveMinutesAgo = now - 5 * 60 * 1000

      let activeCount = 0
      Object.values(devices).forEach((device: any) => {
        const lastUpdate = device?.last_update || device?.current_data?.timestamp
        if (lastUpdate && new Date(lastUpdate).getTime() > fiveMinutesAgo) {
          activeCount++
        }
      })

      console.log(`🔥 Firebase: Found ${activeCount} active devices`)
      return activeCount
    }
    return 0
  })

  return result || 0
}

console.log("🔥 Firebase core service initialized with error recovery")
