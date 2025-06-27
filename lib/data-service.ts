/**
 * ============================================================================
 * DATA SERVICE LIBRARY - ระบบจัดการข้อมูลเซ็นเซอร์และสถิติ
 * ============================================================================
 *
 * ไฟล์นี้จัดการการดึงและประมวลผลข้อมูลจากเซ็นเซอร์ตรวจจับความเหนื่อยล้า
 * รวมถึงการคำนวณสถิติต่างๆ สำหรับแสดงผลใน Dashboard
 *
 * DEPENDENCIES:
 * - lib/firebase.ts: Firebase Realtime Database connection
 * - lib/types.ts: Type definitions
 * - lib/date-utils.ts: Date manipulation utilities
 *
 * USED BY:
 * - components/safety-dashboard.tsx: แสดงข้อมูลหลัก
 * - components/charts-section.tsx: แสดงกราฟและชาร์ต
 * - app/dashboard/reports/page.tsx: รายงานสถิติ
 */

import { database } from "./firebase"
import { ref, get, query, orderByChild, equalTo, startAt, endAt } from "firebase/database"
import type { SensorData, DashboardStats, TimeRange } from "./types"

/**
 * ดึงข้อมูลเซ็นเซอร์ล่าสุดของอุปกรณ์
 *
 * @param deviceId - ID ของอุปกรณ์ (เช่น device_01)
 * @param limit - จำนวนข้อมูลที่ต้องการ (default: 100)
 * @returns Promise<SensorData[]> - อาร์เรย์ของข้อมูลเซ็นเซอร์
 */
export async function getLatestSensorData(deviceId: string, limit = 100): Promise<SensorData[]> {
  try {
    console.log(`📊 DataService: Getting latest sensor data for ${deviceId}, limit: ${limit}`)

    // ใช้ช่วงเวลา 24 ชั่วโมงที่ผ่านมา
    const endTime = Date.now()
    const startTime = endTime - 24 * 60 * 60 * 1000

    const data = await getSensorDataByTimeRange(deviceId, startTime, endTime)

    // เรียงและเอาข้อมูลล่าสุด
    const latestData = data
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .sort((a, b) => a.timestamp - b.timestamp)

    console.log(`📊 DataService: Retrieved ${latestData.length} latest sensor records`)
    return latestData
  } catch (error) {
    console.error("🔥 DataService: Error getting sensor data:", error)
    return []
  }
}

/**
 * ดึงข้อมูลเซ็นเซอร์ในช่วงเวลาที่กำหนด - ปรับปรุงให้จัดการ indexing error
 *
 * @param deviceId - ID ของอุปกรณ์
 * @param startTime - เวลาเริ่มต้น (timestamp)
 * @param endTime - เวลาสิ้นสุด (timestamp)
 * @returns Promise<SensorData[]> - ข้อมูลเซ็นเซอร์ในช่วงเวลาที่กำหนด
 */
export async function getSensorDataByTimeRange(
  deviceId: string,
  startTime: number,
  endTime: number,
): Promise<SensorData[]> {
  try {
    console.log(
      `📊 DataService: Getting sensor data for ${deviceId} from ${new Date(startTime)} to ${new Date(endTime)}`,
    )

    if (!database) {
      console.error("Firebase DB not available for getSensorDataByTimeRange")
      return []
    }

    const startISO = new Date(startTime).toISOString()
    const endISO = new Date(endTime).toISOString()

    // ลองดึงข้อมูลจากหลายแหล่ง
    const sensorData: SensorData[] = []

    // 1. ลองดึงจาก alerts ด้วย indexed query
    try {
      console.log(`🔍 Querying alerts for device: ${deviceId}`)
      const alertsQuery = query(ref(database, "alerts"), orderByChild("device_id"), equalTo(deviceId))
      const alertsSnapshot = await get(alertsQuery)

      if (alertsSnapshot.exists()) {
        const allAlerts = Object.values(alertsSnapshot.val())
        const deviceAlerts = allAlerts.filter((alert: any) => {
          const alertTime = new Date(alert.timestamp).getTime()
          return alertTime >= startTime && alertTime <= endTime
        })
        console.log(`✅ Found ${deviceAlerts.length} alerts in date range.`)

        // แปลงข้อมูล alerts เป็น SensorData
        deviceAlerts.forEach((alert: any) => {
          const alertTime = new Date(alert.timestamp).getTime()
          sensorData.push({
            timestamp: alertTime,
            ear: alert.alert_type === "drowsiness_detected" ? 0.2 : 0.5,
            mouth: alert.alert_type === "yawn_detected" ? 0.8 : 0.3,
            safety_score: alert.severity === "high" ? 20 : alert.severity === "medium" ? 50 : 80,
          })
        })
      }
    } catch (alertError) {
      console.warn("⚠️ DataService: Could not query alerts with index, trying fallback:", alertError)

      // Fallback: ดึงข้อมูล alerts ทั้งหมดแล้วกรองเอง
      try {
        const alertsRef = ref(database, "alerts")
        const alertsSnapshot = await get(alertsRef)

        if (alertsSnapshot.exists()) {
          const allAlerts = Object.values(alertsSnapshot.val())
          const deviceAlerts = allAlerts.filter((alert: any) => {
            const alertTime = new Date(alert.timestamp).getTime()
            return alert.device_id === deviceId && alertTime >= startTime && alertTime <= endTime
          })
          console.log(`✅ Found ${deviceAlerts.length} alerts via fallback method.`)

          deviceAlerts.forEach((alert: any) => {
            const alertTime = new Date(alert.timestamp).getTime()
            sensorData.push({
              timestamp: alertTime,
              ear: alert.alert_type === "drowsiness_detected" ? 0.2 : 0.5,
              mouth: alert.alert_type === "yawn_detected" ? 0.8 : 0.3,
              safety_score: alert.severity === "high" ? 20 : alert.severity === "medium" ? 50 : 80,
            })
          })
        }
      } catch (fallbackError) {
        console.error("❌ DataService: Fallback alerts query also failed:", fallbackError)
      }
    }

    // 2. ลองดึงจาก history
    try {
      console.log(`🔍 Querying history for device: ${deviceId} between ${startISO} and ${endISO}`)
      const historyQuery = query(
        ref(database, `devices/${deviceId}/history`),
        orderByChild("timestamp"),
        startAt(startISO),
        endAt(endISO),
      )
      const historySnapshot = await get(historyQuery)

      if (historySnapshot.exists()) {
        const deviceHistory: HistoricalData[] = []
        Object.entries(historySnapshot.val()).forEach(([key, value]) => {
          deviceHistory.push({ id: key, ...(value as any) })
        })
        console.log(`✅ Found ${deviceHistory.length} history records in date range.`)

        // แปลงข้อมูล history เป็น SensorData
        deviceHistory.forEach((item: any) => {
          const historyTime = new Date(item.timestamp).getTime()
          // ตรวจสอบว่ามีข้อมูลใน timestamp นี้แล้วหรือไม่
          const existingData = sensorData.find((data) => Math.abs(data.timestamp - historyTime) < 60000)

          if (!existingData) {
            sensorData.push({
              timestamp: historyTime,
              ear: item.ear || 0.5,
              mouth: item.mouth_distance || 0.3,
              safety_score: calculateSafetyScoreFromHistory(item),
            })
          }
        })
      }
    } catch (historyError) {
      console.warn("⚠️ DataService: Could not query history:", historyError)
    }

    // 3. ถ้าไม่มีข้อมูลจริง ให้คืนค่า array ว่าง (ไม่สร้างข้อมูลตัวอย่าง)
    if (sensorData.length === 0) {
      console.log(`📊 DataService: No data found for ${deviceId} in the specified time range`)
      return []
    }

    // เรียงข้อมูลตาม timestamp
    sensorData.sort((a, b) => a.timestamp - b.timestamp)

    console.log(`📊 DataService: Retrieved ${sensorData.length} records for time range`)
    return sensorData
  } catch (error) {
    console.error("🔥 DataService: Error getting time range data:", error)
    return []
  }
}

/**
 * คำนวณสถิติสำหรับ Dashboard
 */
export function calculateDashboardStats(sensorData: SensorData[]): DashboardStats {
  console.log(`📊 DataService: Calculating dashboard stats for ${sensorData.length} records`)

  if (sensorData.length === 0) {
    return {
      averageSafetyScore: 100, // เปลี่ยนจาก 0 เป็น 100 เมื่อไม่มีข้อมูล
      totalAlerts: 0,
      fatigueEvents: 0,
      activeTime: 0,
      lastUpdate: Date.now(),
    }
  }

  // คำนวณคะแนนความปลอดภัยเฉลี่ย
  const totalSafetyScore = sensorData.reduce((sum, data) => sum + data.safety_score, 0)
  const averageSafetyScore = Math.round(totalSafetyScore / sensorData.length)

  // นับจำนวนการแจ้งเตือน
  let totalAlerts = 0
  let fatigueEvents = 0

  sensorData.forEach((data) => {
    // High Risk Alert (Safety Score < 50)
    if (data.safety_score < 50) {
      totalAlerts++
      fatigueEvents++
    }
    // Medium Risk Alert (Safety Score < 70)
    else if (data.safety_score < 70) {
      totalAlerts++
    }

    // Eye Closure Alert (Ear < 0.3)
    if (data.ear < 0.3) {
      totalAlerts++
    }

    // Yawning Alert (Mouth > 0.7)
    if (data.mouth > 0.7) {
      totalAlerts++
    }
  })

  // คำนวณเวลาที่ใช้งาน (จากข้อมูลแรกถึงข้อมูลสุดท้าย)
  const firstTimestamp = sensorData[0].timestamp
  const lastTimestamp = sensorData[sensorData.length - 1].timestamp
  const activeTime = Math.round((lastTimestamp - firstTimestamp) / (1000 * 60)) // แปลงเป็นนาที

  const stats: DashboardStats = {
    averageSafetyScore,
    totalAlerts,
    fatigueEvents,
    activeTime,
    lastUpdate: lastTimestamp,
  }

  console.log("📊 DataService: Dashboard stats calculated:", stats)
  return stats
}

/**
 * ดึงข้อมูลสำหรับกราฟแสดงแนวโน้ม
 */
export async function getChartData(deviceId: string, timeRange: TimeRange): Promise<SensorData[]> {
  try {
    console.log(`📊 DataService: Getting chart data for ${deviceId}, range: ${timeRange}`)

    // คำนวณช่วงเวลา
    const now = Date.now()
    let startTime: number

    switch (timeRange) {
      case "1h":
        startTime = now - 60 * 60 * 1000 // 1 ชั่วโมง
        break
      case "6h":
        startTime = now - 6 * 60 * 60 * 1000 // 6 ชั่วโมง
        break
      case "24h":
        startTime = now - 24 * 60 * 60 * 1000 // 24 ชั่วโมง
        break
      case "7d":
        startTime = now - 7 * 24 * 60 * 60 * 1000 // 7 วัน
        break
      default:
        startTime = now - 60 * 60 * 1000 // default 1 ชั่วโมง
    }

    // ดึงข้อมูลในช่วงเวลาที่กำหนด
    const data = await getSensorDataByTimeRange(deviceId, startTime, now)

    // สำหรับช่วงเวลายาว ให้สุ่มตัวอย่างข้อมูลเพื่อลดขนาด
    if (timeRange === "7d" && data.length > 500) {
      const sampledData: SensorData[] = []
      const step = Math.floor(data.length / 500)

      for (let i = 0; i < data.length; i += step) {
        sampledData.push(data[i])
      }

      console.log(`📊 DataService: Sampled data from ${data.length} to ${sampledData.length} points`)
      return sampledData
    }

    return data
  } catch (error) {
    console.error("🔥 DataService: Error getting chart data:", error)
    return []
  }
}

/**
 * ตรวจสอบสถานะการเชื่อมต่อของอุปกรณ์
 */
export async function checkDeviceConnection(deviceId: string): Promise<boolean> {
  try {
    console.log(`📊 DataService: Checking connection for ${deviceId}`)

    // ตรวจสอบจาก current_data
    const currentDataRef = ref(database, `devices/${deviceId}/current_data`)
    const snapshot = await get(currentDataRef)

    if (!snapshot.exists()) {
      console.log(`📊 DataService: No current data found for ${deviceId} - offline`)
      return false
    }

    const currentData = snapshot.val()
    const lastTimestamp = new Date(currentData.timestamp).getTime()
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

    const isOnline = lastTimestamp > fiveMinutesAgo
    console.log(`📊 DataService: Device ${deviceId} is ${isOnline ? "online" : "offline"}`)

    return isOnline
  } catch (error) {
    console.error("🔥 DataService: Error checking device connection:", error)
    return false
  }
}

/**
 * Subscribe to historical data with caching for better performance
 */
export function subscribeToHistoricalDataWithCache(
  deviceId: string,
  startTime: number,
  endTime: number,
  callback: (data: HistoricalData[], stats: DailyStats) => void,
): () => void {
  console.log(`📊 DataService: Subscribing to historical data with cache for ${deviceId}`)

  let isActive = true
  let lastFetchTime = 0
  const CACHE_DURATION = 30000 // 30 seconds cache

  const fetchData = async () => {
    if (!isActive) return

    try {
      const now = Date.now()
      if (now - lastFetchTime < CACHE_DURATION) {
        console.log(`📊 DataService: Using cached data for ${deviceId}`)
        return
      }

      console.log(`📊 DataService: Fetching fresh data for ${deviceId}`)
      const data = await getSensorDataByTimeRange(deviceId, startTime, endTime)

      // Convert SensorData to HistoricalData format
      const historicalData: HistoricalData[] = data.map((item, index) => ({
        id: `${deviceId}-${item.timestamp}-${index}`,
        timestamp: new Date(item.timestamp).toISOString(),
        ear_value: item.ear,
        ear: item.ear,
        yawn_events: item.mouth > 0.7 ? 1 : 0,
        drowsiness_events: item.ear < 0.25 ? 1 : 0,
        critical_alerts: item.safety_score < 30 ? 1 : 0,
        device_id: deviceId,
        status:
          item.safety_score < 30
            ? "CRITICAL: EXTENDED DROWSINESS"
            : item.ear < 0.25
              ? "DROWSINESS DETECTED"
              : item.mouth > 0.7
                ? "YAWN DETECTED"
                : "NORMAL",
        mouth_distance: item.mouth,
        face_detected_frames: 1,
      }))

      // Calculate daily stats
      const stats: DailyStats = {
        totalYawns: historicalData.filter((d) => d.yawn_events > 0).length,
        totalDrowsiness: historicalData.filter((d) => d.drowsiness_events > 0).length,
        totalAlerts: historicalData.filter((d) => d.critical_alerts > 0).length,
        averageEAR: data.length > 0 ? data.reduce((sum, d) => sum + d.ear, 0) / data.length : 0,
      }

      lastFetchTime = now

      if (isActive) {
        callback(historicalData, stats)
      }
    } catch (error) {
      console.error(`🔥 DataService: Error fetching historical data for ${deviceId}:`, error)
      if (isActive) {
        callback([], {
          totalYawns: 0,
          totalDrowsiness: 0,
          totalAlerts: 0,
          averageEAR: 0,
        })
      }
    }
  }

  // Initial fetch
  fetchData()

  // Set up periodic refresh
  const interval = setInterval(fetchData, CACHE_DURATION)

  // Return unsubscribe function
  return () => {
    console.log(`📊 DataService: Unsubscribing from historical data for ${deviceId}`)
    isActive = false
    clearInterval(interval)
  }
}

/**
 * สร้างรายงานสรุปจากข้อมูลประวัติ
 */
export function generateReport(data: HistoricalData[], stats: DailyStats): ReportData {
  const trends = analyzeTrends(data)
  const recommendations = generateRecommendations(stats, trends)

  return {
    stats,
    trends,
    recommendations,
    summary: {
      totalEvents: data.length,
      riskLevel: stats.totalAlerts > 10 ? "high" : stats.totalAlerts > 5 ? "medium" : "low",
    },
  }
}

/**
 * คำนวณคะแนนความปลอดภัย - ปรับปรุงให้จัดการกรณีไม่มีข้อมูล
 */
export function calculateSafetyScore(stats: DailyStats, hasData = true): number {
  // ถ้าไม่มีข้อมูลเลย ให้คืนค่า 100
  if (
    !hasData ||
    (stats.totalYawns === 0 && stats.totalDrowsiness === 0 && stats.totalAlerts === 0 && stats.averageEAR === 0)
  ) {
    return 100
  }

  let score = 100
  score -= Math.min(stats.totalYawns * 2, 30)
  score -= Math.min(stats.totalDrowsiness * 5, 40)
  score -= Math.min(stats.totalAlerts * 10, 50)

  // เฉพาะเมื่อมีข้อมูล EAR จริง
  if (stats.averageEAR > 0) {
    if (stats.averageEAR < 0.25) score -= 20
    else if (stats.averageEAR < 0.3) score -= 10
  }

  return Math.max(score, 0)
}

/**
 * วิเคราะห์แนวโน้ม
 */
function analyzeTrends(data: HistoricalData[]) {
  const midPoint = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, midPoint)
  const secondHalf = data.slice(midPoint)

  const firstHalfYawns = firstHalf.filter((d) => d.yawn_events > 0).length
  const secondHalfYawns = secondHalf.filter((d) => d.yawn_events > 0).length

  const firstHalfDrowsiness = firstHalf.filter((d) => d.drowsiness_events > 0).length
  const secondHalfDrowsiness = secondHalf.filter((d) => d.drowsiness_events > 0).length

  return {
    yawnTrend:
      secondHalfYawns > firstHalfYawns ? "increasing" : secondHalfYawns < firstHalfYawns ? "decreasing" : "stable",
    drowsinessTrend:
      secondHalfDrowsiness > firstHalfDrowsiness
        ? "increasing"
        : secondHalfDrowsiness < firstHalfDrowsiness
          ? "decreasing"
          : "stable",
    alertnessTrend:
      secondHalfDrowsiness < firstHalfDrowsiness
        ? "improving"
        : secondHalfDrowsiness > firstHalfDrowsiness
          ? "declining"
          : "stable",
  }
}

/**
 * สร้างคำแนะนำ
 */
function generateRecommendations(stats: DailyStats, trends: any): string[] {
  const recommendations: string[] = []

  if (stats.totalYawns > 10) {
    recommendations.push("พบการหาวบ่อย แนะนำให้พักผ่อนให้เพียงพอก่อนขับขี่")
  }

  if (stats.totalDrowsiness > 5) {
    recommendations.push("ตรวจพบความง่วงนอนบ่อย ควรหยุดพักทุก 2 ชั่วโมง")
  }

  if (stats.totalAlerts > 3) {
    recommendations.push("มีการแจ้งเตือนด่วนหลายครั้ง ควรตรวจสอบสุขภาพและหลีกเลี่ยงการขับขี่เมื่อเหนื่อยล้า")
  }

  if (stats.averageEAR < 0.25) {
    recommendations.push("ค่าเฉลี่ย EAR ต่ำ แสดงถึงการปิดตาบ่อย ควรพักผ่อนเพิ่มเติม")
  }

  if (trends.yawnTrend === "increasing") {
    recommendations.push("แนวโน้มการหาวเพิ่มขึ้น ควรปรับเวลาพักผ่อน")
  }

  if (recommendations.length === 0) {
    recommendations.push("ไม่มีข้อมูลการขับขี่ในช่วงเวลาที่เลือก")
  }

  return recommendations
}

// เพิ่ม interface สำหรับ ReportData
export interface ReportData {
  stats: DailyStats
  trends: {
    yawnTrend: string
    drowsinessTrend: string
    alertnessTrend: string
  }
  recommendations: string[]
  summary: {
    totalEvents: number
    riskLevel: string
  }
}

function calculateSafetyScoreFromHistory(historyData: any): number {
  let score = 100
  score -= (historyData.yawn_events || 0) * 2
  score -= (historyData.drowsiness_events || 0) * 5
  score -= (historyData.critical_alerts || 0) * 10
  if (historyData.ear < 0.25) score -= 20
  return Math.max(score, 0)
}

export interface DailyStats {
  totalYawns: number
  totalDrowsiness: number
  totalAlerts: number
  averageEAR: number
}

export interface HistoricalData {
  id: string
  timestamp: string
  ear_value: number
  ear: number
  yawn_events: number
  drowsiness_events: number
  critical_alerts: number
  device_id: string
  status: string
  mouth_distance: number
  face_detected_frames: number
}

// ---------------------------------------------------------------------------
// Aggregated service export (for legacy imports)
// ---------------------------------------------------------------------------
export const dataService = {
  getLatestSensorData,
  getSensorDataByTimeRange,
  calculateDashboardStats,
  getChartData,
  checkDeviceConnection,
  subscribeToHistoricalDataWithCache,
  generateReport,
  calculateSafetyScore,
}
