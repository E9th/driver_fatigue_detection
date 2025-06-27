"use client"

import { initializeApp, getApps } from "firebase/app"
import {
  getDatabase,
  ref,
  onValue,
  off,
  query,
  get,
  set,
  orderByChild,
  equalTo,
  startAt,
  endAt,
} from "firebase/database"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { firebaseConfig } from "./config"
import type { DeviceData, HistoricalData, SafetyData } from "./types"

let app: any = null
let database: any = null
let auth: any = null

try {
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
  console.error("❌ Firebase initialization error", error)
}

export { app, database, auth }

export const subscribeToCurrentData = (deviceId: string, callback: (data: DeviceData | null) => void): (() => void) => {
  if (!database) return () => {}
  const currentDataRef = ref(database, `devices/${deviceId}/current_data`)
  const listener = onValue(
    currentDataRef,
    (snapshot) => {
      callback(snapshot.val())
    },
    (error) => {
      console.error(`Error subscribing to current data for ${deviceId}:`, error)
      callback(null)
    },
  )
  return () => off(currentDataRef, "value", listener)
}

export const getFilteredSafetyData = async (
  deviceId: string,
  startDate: string | Date,
  endDate: string | Date,
): Promise<SafetyData | null> => {
  if (!database) {
    console.error("Firebase DB not available for getFilteredSafetyData")
    return null
  }

  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const startISO = new Date(startDate).toISOString()
  const endISO = new Date(endDate).toISOString()

  try {
    console.log(`🔍 Querying alerts for device: ${deviceId}`)
    console.log(`🔍 Date range: ${startISO} to ${endISO}`)

    // Query alerts with fallback method
    let deviceAlerts: any[] = []
    try {
      const alertsQuery = query(ref(database, "alerts"), orderByChild("device_id"), equalTo(deviceId))
      const alertsSnapshot = await get(alertsQuery)

      if (alertsSnapshot.exists()) {
        const allAlerts = Object.values(alertsSnapshot.val())
        deviceAlerts = allAlerts.filter((alert: any) => {
          const alertTime = new Date(alert.timestamp).getTime()
          return alertTime >= start && alertTime <= end
        })
      }
    } catch (alertError) {
      console.warn("⚠️ Indexed query failed, trying fallback:", alertError)
      // Fallback: get all alerts and filter
      const alertsRef = ref(database, "alerts")
      const alertsSnapshot = await get(alertsRef)

      if (alertsSnapshot.exists()) {
        const allAlerts = Object.values(alertsSnapshot.val())
        deviceAlerts = allAlerts.filter((alert: any) => {
          const alertTime = new Date(alert.timestamp).getTime()
          return alert.device_id === deviceId && alertTime >= start && alertTime <= end
        })
      }
    }

    console.log(`✅ Found ${deviceAlerts.length} alerts in date range.`)

    // Query history data
    console.log(`🔍 Querying history for device: ${deviceId}`)
    const historyQuery = query(
      ref(database, `devices/${deviceId}/history`),
      orderByChild("timestamp"),
      startAt(startISO),
      endAt(endISO),
    )
    const historySnapshot = await get(historyQuery)

    const deviceHistory: HistoricalData[] = []
    if (historySnapshot.exists()) {
      Object.entries(historySnapshot.val()).forEach(([key, value]) => {
        deviceHistory.push({ id: key, ...(value as any) })
      })
    }
    console.log(`✅ Found ${deviceHistory.length} history records in date range.`)

    // Calculate statistics
    const yawnEvents = deviceAlerts.filter((a) => a.alert_type === "yawn_detected").length
    const fatigueEvents = deviceAlerts.filter((a) => a.alert_type === "drowsiness_detected").length
    const criticalEvents = deviceAlerts.filter((a) => a.alert_type === "critical_drowsiness").length

    const earValues = deviceHistory.map((h: any) => h.ear).filter((ear) => ear > 0)
    const averageEAR = earValues.length > 0 ? earValues.reduce((a, b) => a + b, 0) / earValues.length : 0

    // Calculate safety score
    let safetyScore = 100
    safetyScore -= Math.min(yawnEvents * 2, 30)
    safetyScore -= Math.min(fatigueEvents * 5, 40)
    safetyScore -= Math.min(criticalEvents * 10, 50)
    if (averageEAR > 0 && averageEAR < 0.25) safetyScore -= 20
    else if (averageEAR > 0 && averageEAR < 0.3) safetyScore -= 10

    // Format events for display
    const events = deviceAlerts
      .map((a: any, index: number) => ({
        id: a.timestamp + index,
        timestamp: a.timestamp,
        type: a.alert_type,
        severity: a.severity === "high" ? 3 : a.severity === "medium" ? 2 : 1,
        details: a.alert_type.replace(/_/g, " ").replace("detected", "").trim(),
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const result: SafetyData = {
      deviceId,
      events,
      safetyScore: Math.max(0, Math.round(safetyScore)),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      stats: {
        yawnEvents,
        fatigueEvents,
        criticalEvents,
        averageEAR: Number(averageEAR.toFixed(3)),
      },
    }

    console.log("📊 Final safety data:", result)
    return result
  } catch (error) {
    console.error("Error in getFilteredSafetyData:", error)

    // Return empty but valid structure on error
    return {
      deviceId,
      events: [],
      safetyScore: 0,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      stats: {
        yawnEvents: 0,
        fatigueEvents: 0,
        criticalEvents: 0,
        averageEAR: 0,
      },
    }
  }
}

export const signIn = async (email: string, password: string) => {
  if (!auth) throw new Error("Auth not initialized")
  return await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => ({ success: true, user: userCredential.user }))
    .catch((error) => ({ success: false, error: error.message }))
}

export const registerUser = async (userData: any) => {
  if (!auth || !database) throw new Error("Firebase not initialized")
  const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
  const userProfile = { uid: userCredential.user.uid, ...userData }
  delete userProfile.password
  await set(ref(database, `users/${userCredential.user.uid}`), userProfile)
  return { success: true, user: userCredential.user }
}

export const signOut = async () => {
  if (!auth) throw new Error("Auth not initialized")
  return await firebaseSignOut(auth)
}
