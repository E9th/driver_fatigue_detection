"use client"

import { getDatabase, ref, get } from "firebase/database"
import type { SafetyData } from "./types"

/**
 * ดึงข้อมูลความปลอดภัยจาก Firebase โดยรวมข้อมูลจากทั้ง history และ alerts
 * แก้ไขปัญหาการนับจำนวนเหตุการณ์ที่ไม่ตรงกัน
 * @param deviceId รหัสอุปกรณ์
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @returns ข้อมูลความปลอดภัย
 */
export const getFilteredSafetyDataFixed = async (
  deviceId: string,
  startDate: string,
  endDate: string,
): Promise<SafetyData | null> => {
  try {
    const database = getDatabase()
    if (!database) {
      console.warn("🔧 Firebase not available for getFilteredSafetyData")
      return null
    }

    console.log(`🔍 Firebase: Getting safety data for ${deviceId} from ${startDate} to ${endDate}`)

    // ดึงข้อมูลจาก alerts
    const alertsRef = ref(database, "alerts")
    const alertsSnapshot = await get(alertsRef)

    // ดึงข้อมูลจาก history
    const historyRef = ref(database, `devices/${deviceId}/history`)
    const historySnapshot = await get(historyRef)

    // แปลงวันที่เป็น timestamp เพื่อใช้ในการกรอง
    const startTime = new Date(startDate).getTime()
    const endTime = new Date(endDate).getTime()

    // กรองและแปลงข้อมูล alerts
    const events: any[] = []
    let yawnCount = 0
    let drowsinessCount = 0
    let criticalCount = 0

    if (alertsSnapshot.exists()) {
      const alertsData = alertsSnapshot.val()

      Object.entries(alertsData).forEach(([id, alert]: [string, any]) => {
        // ตรวจสอบว่า alert เป็นของ deviceId ที่ต้องการและอยู่ในช่วงเวลาที่กำหนด
        if (
          alert.device_id === deviceId &&
          alert.timestamp &&
          new Date(alert.timestamp).getTime() >= startTime &&
          new Date(alert.timestamp).getTime() <= endTime
        ) {
          // เพิ่มการนับตามประเภทของ alert
          if (alert.alert_type === "yawn_detected") {
            yawnCount++
          } else if (alert.alert_type === "drowsiness_detected") {
            drowsinessCount++
          } else if (alert.alert_type === "critical_drowsiness") {
            criticalCount++
          }

          events.push({
            id,
            timestamp: alert.timestamp,
            type:
              alert.alert_type === "yawn_detected"
                ? "yawn"
                : alert.alert_type === "drowsiness_detected" || alert.alert_type === "critical_drowsiness"
                  ? "fatigue"
                  : "other",
            severity: alert.severity === "high" ? 3 : alert.severity === "medium" ? 2 : 1,
            details: alert.alert_type,
          })
        }
      })
    }

    // คำนวณค่า EAR เฉลี่ย
    let totalEAR = 0
    let validEARCount = 0

    if (historySnapshot.exists()) {
      const historyData = historySnapshot.val()

      Object.values(historyData).forEach((item: any) => {
        if (
          item.timestamp &&
          new Date(item.timestamp).getTime() >= startTime &&
          new Date(item.timestamp).getTime() <= endTime &&
          item.ear &&
          item.ear > 0
        ) {
          totalEAR += item.ear
          validEARCount++
        }
      })
    }

    const averageEAR = validEARCount > 0 ? totalEAR / validEARCount : 0

    // คำนวณคะแนนความปลอดภัย
    let safetyScore = 100

    // หักคะแนนตามจำนวนเหตุการณ์
    safetyScore -= Math.min(yawnCount * 2, 30) // หักสูงสุด 30 คะแนนสำหรับการหาว
    safetyScore -= Math.min(drowsinessCount * 5, 40) // หักสูงสุด 40 คะแนนสำหรับความเหนื่อยล้า
    safetyScore -= Math.min(criticalCount * 10, 50) // หักสูงสุด 50 คะแนนสำหรับเหตุการณ์วิกฤต

    // หักคะแนนตามค่า EAR เฉลี่ย
    if (averageEAR < 0.25) {
      safetyScore -= 20
    } else if (averageEAR < 0.3) {
      safetyScore -= 10
    }

    // ปรับคะแนนให้อยู่ในช่วง 0-100
    safetyScore = Math.max(0, Math.min(100, safetyScore))

    console.log(`✅ Firebase: Safety data processed for ${deviceId}`, {
      eventsCount: events.length,
      yawnCount,
      drowsinessCount,
      criticalCount,
      averageEAR,
      safetyScore,
    })

    return {
      deviceId,
      events: events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      safetyScore,
      startDate,
      endDate,
      stats: {
        yawnEvents: yawnCount,
        fatigueEvents: drowsinessCount + criticalCount,
        criticalEvents: criticalCount,
        averageEAR,
      },
    }
  } catch (error) {
    console.error(`❌ Firebase: Error getting safety data for ${deviceId}:`, error)
    return null
  }
}
