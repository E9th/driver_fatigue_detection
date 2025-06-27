/**
 * ============================================================================
 * FIREBASE CONFIGURATION AND SERVICES
 * ============================================================================
 */

import { initializeApp, getApps } from "firebase/app"
import { getDatabase, ref, get } from "firebase/database"
import { getAuth } from "firebase/auth"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7Syu0aTE5WkAr7cMWdyllo5F6g--NsxM",
  authDomain: "driver-fatigue-detection.firebaseapp.com",
  databaseURL: "https://driver-fatigue-detection-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "driver-fatigue-detection",
  storageBucket: "driver-fatigue-detection.firebasestorage.app",
  messagingSenderId: "590232998044",
  appId: "1:590232998044:web:7c5c5f5c5f5c5f5c5f5c5f",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const database = getDatabase(app)
export const auth = getAuth(app)

console.log("✅ Firebase: Initialized successfully")

// Types for better type safety
export interface SafetyEvent {
  id: string
  type: string
  severity: number
  timestamp: number
  details?: string
}

export interface SafetyStats {
  yawnEvents: number
  fatigueEvents: number
  criticalEvents: number
}

export interface SafetyData {
  stats: SafetyStats
  events: SafetyEvent[]
  safetyScore: number
}

/**
 * ปรับปรุง getFilteredSafetyData ให้ทำงานได้จริงตามข้อมูลจริง
 */
export async function getFilteredSafetyData(deviceId: string, startDate: string, endDate: string): Promise<SafetyData> {
  try {
    console.log(`🔍 getFilteredSafetyData: Loading data for ${deviceId} from ${startDate} to ${endDate}`)

    const startTime = new Date(startDate).getTime()
    const endTime = new Date(endDate).getTime()

    // ดึงข้อมูลจาก alerts collection
    const alertsRef = ref(database, "alerts")
    const alertsSnapshot = await get(alertsRef)

    const alerts: SafetyEvent[] = []
    const stats: SafetyStats = {
      yawnEvents: 0,
      fatigueEvents: 0,
      criticalEvents: 0,
    }

    if (alertsSnapshot.exists()) {
      const allAlerts = alertsSnapshot.val()

      // กรองเฉพาะ alerts ของ device และในช่วงเวลาที่กำหนด
      Object.entries(allAlerts).forEach(([key, alert]: [string, any]) => {
        const alertTime = new Date(alert.timestamp).getTime()

        if (alert.device_id === deviceId && alertTime >= startTime && alertTime <= endTime) {
          // แปลงเป็น SafetyEvent
          const safetyEvent: SafetyEvent = {
            id: key,
            type: alert.alert_type || "unknown",
            severity: alert.severity === "high" ? 3 : alert.severity === "medium" ? 2 : 1,
            timestamp: alertTime,
            details: `${alert.alert_type} - ${alert.severity}`,
          }

          alerts.push(safetyEvent)

          // นับสถิติ
          if (alert.alert_type === "yawn_detected") {
            stats.yawnEvents++
          } else if (alert.alert_type === "drowsiness_detected") {
            stats.fatigueEvents++
          } else if (alert.alert_type === "critical_drowsiness") {
            stats.criticalEvents++
          }
        }
      })
    }

    // ดึงข้อมูลจาก history เพื่อคำนวณ safety score
    const historyRef = ref(database, `devices/${deviceId}/history`)
    const historySnapshot = await get(historyRef)

    let averageEAR = 0 // เปลี่ยนจาก 0.5 เป็น 0
    let hasValidEARData = false

    if (historySnapshot.exists()) {
      const historyData = historySnapshot.val()
      const historyArray = Object.values(historyData) as any[]

      // กรองเฉพาะข้อมูลในช่วงเวลาที่กำหนด
      const filteredHistory = historyArray.filter((h) => {
        const historyTime = new Date(h.timestamp).getTime()
        return historyTime >= startTime && historyTime <= endTime
      })

      // คำนวณค่าเฉลี่ย EAR จากข้อมูลในช่วงเวลาที่กำหนดเท่านั้น
      const validEARRecords = filteredHistory.filter((h) => h.ear && h.ear > 0)
      if (validEARRecords.length > 0) {
        averageEAR = validEARRecords.reduce((sum, h) => sum + h.ear, 0) / validEARRecords.length
        hasValidEARData = true
      }
    }

    // คำนวณ Safety Score ตามสูตรจริง
    const safetyScore = calculateSafetyScore(
      stats.yawnEvents,
      stats.fatigueEvents,
      stats.criticalEvents,
      averageEAR,
      hasValidEARData,
    )

    console.log(`✅ getFilteredSafetyData: Found ${alerts.length} events, safety score: ${safetyScore}`)

    return {
      stats,
      events: alerts.sort((a, b) => b.timestamp - a.timestamp), // เรียงจากใหม่ไปเก่า
      safetyScore,
    }
  } catch (error) {
    console.error("❌ getFilteredSafetyData error:", error)

    // Return empty data structure on error
    return {
      stats: {
        yawnEvents: 0,
        fatigueEvents: 0,
        criticalEvents: 0,
      },
      events: [],
      safetyScore: 100,
    }
  }
}

/**
 * คำนวณ Safety Score ตามสูตรเดียวกับใน data-analyzer.ts
 */
function calculateSafetyScore(
  yawnCount: number,
  drowsinessCount: number,
  criticalCount: number,
  averageEAR: number,
  hasValidEARData = true,
): number {
  let score = 100

  // หักคะแนนตามจำนวนเหตุการณ์
  score -= Math.min(yawnCount * 2, 30) // หักสูงสุด 30 คะแนนสำหรับการหาว
  score -= Math.min(drowsinessCount * 5, 40) // หักสูงสุด 40 คะแนนสำหรับความง่วง
  score -= Math.min(criticalCount * 10, 50) // หักสูงสุด 50 คะแนนสำหรับเหตุการณ์วิกฤต

  // หักคะแนนตามค่า EAR เฉลี่ย เฉพาะเมื่อมีข้อมูลจริง
  if (hasValidEARData && averageEAR > 0) {
    if (averageEAR < 0.25) {
      score -= 20
    } else if (averageEAR < 0.3) {
      score -= 10
    }
  }

  // ปรับคะแนนให้อยู่ในช่วง 0-100
  return Math.max(0, Math.min(100, score))
}

// Export other existing functions...
export * from "./firebase-singleton"
