/**
 * Firebase Core Service
 * Handles Firebase initialization and core data operations
 */

import { initializeApp, getApps } from "firebase/app"
import { getDatabase, ref, onValue, off, query, limitToLast, get } from "firebase/database"
import { getAuth } from "firebase/auth"
import { firebaseConfig } from "./config"
import type { DeviceData, HistoricalData } from "./types"

// Firebase instances
let app: any = null
let database: any = null
let auth: any = null

/**
 * Initialize Firebase with error handling
 * Only runs on client side
 */
const initializeFirebase = () => {
  if (typeof window === "undefined") return

  try {
    console.log("🔥 Firebase: Initializing...")

    const existingApps = getApps()
    if (existingApps.length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = existingApps[0]
    }

    database = getDatabase(app)
    auth = getAuth(app)

    console.log("✅ Firebase: Initialized successfully")
  } catch (error) {
    console.error("❌ Firebase initialization error:", error)
    database = null
    auth = null
  }
}

// Initialize Firebase
initializeFirebase()

// Export Firebase instances
export { app, database, auth }

/**
 * Subscribe to real-time current device data
 * @param deviceId - Device identifier
 * @param callback - Function to handle data updates
 * @returns Unsubscribe function
 */
export const subscribeToCurrentData = (deviceId: string, callback: (data: DeviceData | null) => void): (() => void) => {
  if (!database) {
    console.warn("🔧 Firebase not available, no real-time data")
    if (typeof callback === "function") {
      callback(null)
    }
    return () => {}
  }

  // Validate callback is a function
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
      },
    )
  } catch (error) {
    console.error(`❌ Firebase: Exception in subscribeToCurrentData for ${deviceId}:`, error)
    callback(null)
  }

  return () => {
    console.log(`🔥 Firebase: Unsubscribing from current data for ${deviceId}`)
    off(currentDataRef)
  }
}

/**
 * Subscribe to historical device data with date filtering
 * @param deviceId - Device identifier
 * @param startDate - Start date for filtering
 * @param endDate - End date for filtering
 * @param callback - Function to handle data updates
 * @returns Unsubscribe function
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

  // Validate callback is a function
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
          // Transform Firebase data to HistoricalData format
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

          // Filter by date range
          let filteredData = historyArray
          if (startDate && endDate) {
            const start = new Date(startDate).getTime()
            const end = new Date(endDate).getTime()
            filteredData = historyArray.filter((item) => {
              const itemTime = new Date(item.timestamp).getTime()
              return itemTime >= start && itemTime <= end
            })
          }

          // Sort by timestamp
          filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          callback(filteredData)
        } else {
          callback([])
        }
      },
      (error) => {
        console.error(`❌ Firebase: Error subscribing to historical data for ${deviceId}:`, error)
        callback([])
      },
    )
  } catch (error) {
    console.error(`❌ Firebase: Exception in subscribeToHistoricalData for ${deviceId}:`, error)
    callback([])
  }

  return () => {
    console.log(`🔥 Firebase: Unsubscribing from historical data for ${deviceId}`)
    off(historyQuery)
  }
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
  try {
    if (!database) return 0

    const devicesRef = ref(database, "devices")
    const snapshot = await get(devicesRef)

    if (snapshot.exists()) {
      const count = Object.keys(snapshot.val()).length
      console.log(`🔥 Firebase: Found ${count} total devices`)
      return count
    }
    return 0
  } catch (error) {
    console.error("❌ Error getting device count:", error)
    return 0
  }
}

export const getActiveDeviceCount = async (): Promise<number> => {
  try {
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
  } catch (error) {
    console.error("❌ Error getting active device count:", error)
    return 0
  }
}

/**
 * Get list of device IDs that are currently assigned to users
 * @returns Promise with array of used device IDs
 */
export const getUsedDeviceIds = async (): Promise<string[]> => {
  if (!database) {
    console.log("🔧 Firebase not available")
    return []
  }

  try {
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
        .filter((id) => id !== "null" && id !== "00") // Filter out null and invalid IDs
      console.log("🔥 Firebase: Used devices:", usedDevices)
      return usedDevices
    } else {
      console.log("🔥 Firebase: No users found, no devices used")
      return []
    }
  } catch (error) {
    console.error("🔥 Firebase: Error getting used devices:", error)
    return []
  }
}

/**
 * Check if email is already registered
 * @param email - Email to check
 * @returns Promise with availability status
 */
export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  if (!database) {
    console.log("🔧 Firebase not available")
    return true
  }

  try {
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
  } catch (error) {
    console.error("🔥 Firebase: Error checking email:", error)
    return true
  }
}
console.log("🔥 Firebase core service initialized")
