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
import { ref, get, query, orderByChild, limitToLast, startAt, endAt } from "firebase/database"
import type { SensorData, DashboardStats, TimeRange } from "./types"

/**
 * ดึงข้อมูลเซ็นเซอร์ล่าสุดของอุปกรณ์
 *
 * @param deviceId - ID ของอุปกรณ์ (เช่น device_01)
 * @param limit - จำนวนข้อมูลที่ต้องการ (default: 100)
 * @returns Promise<SensorData[]> - อาร์เรย์ของข้อมูลเซ็นเซอร์
 *
 * FIREBASE PATH: /sensor_data/{deviceId}/
 * QUERY: orderByChild('timestamp').limitToLast(limit)
 *
 * DATA STRUCTURE:
 * {
 *   timestamp: number,
 *   ear: number (0-1),
 *   mouth: number (0-1),
 *   safety_score: number (0-100)
 * }
 */
export async function getLatestSensorData(deviceId: string, limit = 100): Promise<SensorData[]> {
  try {
    console.log(`📊 DataService: Getting latest sensor data for ${deviceId}, limit: ${limit}`)

    // สร้าง reference และ query
    const sensorRef = ref(database, `sensor_data/${deviceId}`)
    const sensorQuery = query(sensorRef, orderByChild("timestamp"), limitToLast(limit))

    // ดึงข้อมูลจาก Firebase
    const snapshot = await get(sensorQuery)

    if (!snapshot.exists()) {
      console.log(`📊 DataService: No sensor data found for ${deviceId}`)
      return []
    }

    // แปลงข้อมูลเป็น array และเรียงตาม timestamp
    const data: SensorData[] = []
    snapshot.forEach((childSnapshot) => {
      const sensorData = childSnapshot.val()
      data.push({
        timestamp: sensorData.timestamp,
        ear: sensorData.ear || 0,
        mouth: sensorData.mouth || 0,
        safety_score: sensorData.safety_score || 0,
      })
    })

    // เรียงข้อมูลจากเก่าไปใหม่
    data.sort((a, b) => a.timestamp - b.timestamp)

    console.log(`📊 DataService: Retrieved ${data.length} sensor records`)
    return data
  } catch (error) {
    console.error("🔥 DataService: Error getting sensor data:", error)
    return []
  }
}

/**
 * ดึงข้อมูลเซ็นเซอร์ในช่วงเวลาที่กำหนด
 *
 * @param deviceId - ID ของอุปกรณ์
 * @param startTime - เวลาเริ่มต้น (timestamp)
 * @param endTime - เวลาสิ้นสุด (timestamp)
 * @returns Promise<SensorData[]> - ข้อมูลเซ็นเซอร์ในช่วงเวลาที่กำหนด
 *
 * FIREBASE QUERY:
 * orderByChild('timestamp').startAt(startTime).endAt(endTime)
 *
 * USE CASES:
 * - ดูข้อมูลย้อนหลังตามวันที่
 * - สร้างรายงานประจำวัน/สัปดาห์/เดือน
 * - วิเคราะห์แนวโน้มในช่วงเวลาเฉพาะ
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

    const sensorRef = ref(database, `sensor_data/${deviceId}`)
    const timeRangeQuery = query(sensorRef, orderByChild("timestamp"), startAt(startTime), endAt(endTime))

    const snapshot = await get(timeRangeQuery)

    if (!snapshot.exists()) {
      return []
    }

    const data: SensorData[] = []
    snapshot.forEach((childSnapshot) => {
      const sensorData = childSnapshot.val()
      data.push({
        timestamp: sensorData.timestamp,
        ear: sensorData.ear || 0,
        mouth: sensorData.mouth || 0,
        safety_score: sensorData.safety_score || 0,
      })
    })

    data.sort((a, b) => a.timestamp - b.timestamp)

    console.log(`📊 DataService: Retrieved ${data.length} records for time range`)
    return data
  } catch (error) {
    console.error("🔥 DataService: Error getting time range data:", error)
    return []
  }
}

/**
 * คำนวณสถิติสำหรับ Dashboard
 *
 * @param sensorData - อาร์เรย์ของข้อมูลเซ็นเซอร์
 * @returns DashboardStats - สถิติที่คำนวณแล้ว
 *
 * CALCULATED METRICS:
 * - averageSafetyScore: คะแนนความปลอดภัยเฉลี่ย
 * - totalAlerts: จำนวนการแจ้งเตือนทั้งหมด
 * - fatigueEvents: จำนวนครั้งที่ตรวจพบความเหนื่อยล้า
 * - activeTime: เวลาที่ใช้งานระบบ (นาที)
 * - lastUpdate: เวลาอัปเดตล่าสุด
 *
 * ALERT CRITERIA:
 * - Safety Score < 50: High Risk Alert
 * - Safety Score < 70: Medium Risk Alert
 * - Ear < 0.3: Eye Closure Alert
 * - Mouth > 0.7: Yawning Alert
 */
export function calculateDashboardStats(sensorData: SensorData[]): DashboardStats {
  console.log(`📊 DataService: Calculating dashboard stats for ${sensorData.length} records`)

  if (sensorData.length === 0) {
    return {
      averageSafetyScore: 0,
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
 *
 * @param deviceId - ID ของอุปกรณ์
 * @param timeRange - ช่วงเวลาที่ต้องการ ('1h', '6h', '24h', '7d')
 * @returns Promise<SensorData[]> - ข้อมูลสำหรับกราฟ
 *
 * TIME RANGES:
 * - '1h': 1 ชั่วโมงที่ผ่านมา
 * - '6h': 6 ชั่วโมงที่ผ่านมา
 * - '24h': 24 ชั่วโมงที่ผ่านมา
 * - '7d': 7 วันที่ผ่านมา
 *
 * DATA SAMPLING:
 * - สำหรับช่วงเวลาสั้น: ใช้ข้อมูลทุกจุด
 * - สำหรับช่วงเวลายาว: สุ่มตัวอย่างเพื่อลดขนาดข้อมูล
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
 *
 * @param deviceId - ID ของอุปกรณ์
 * @returns Promise<boolean> - true ถ้าอุปกรณ์ออนไลน์
 *
 * CONNECTION CRITERIA:
 * - มีข้อมูลใหม่ภายใน 5 นาทีที่ผ่านมา = ออนไลน์
 * - ไม่มีข้อมูลใหม่เกิน 5 นาที = ออฟไลน์
 *
 * USED BY:
 * - components/connection-status.tsx: แสดงสถานะการเชื่อมต่อ
 * - Dashboard components: แสดงสถานะอุปกรณ์
 */
export async function checkDeviceConnection(deviceId: string): Promise<boolean> {
  try {
    console.log(`📊 DataService: Checking connection for ${deviceId}`)

    // ดึงข้อมูลล่าสุด 1 รายการ
    const latestData = await getLatestSensorData(deviceId, 1)

    if (latestData.length === 0) {
      console.log(`📊 DataService: No data found for ${deviceId} - offline`)
      return false
    }

    // ตรวจสอบว่าข้อมูลล่าสุดอายุไม่เกิน 5 นาที
    const lastTimestamp = latestData[0].timestamp
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
 *
 * @param deviceId - ID ของอุปกรณ์
 * @param startTime - เวลาเริ่มต้น (timestamp)
 * @param endTime - เวลาสิ้นสุด (timestamp)
 * @param callback - Callback function ที่จะถูกเรียกเมื่อมีข้อมูลใหม่
 * @returns Function to unsubscribe
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

// Simple function to get basic device status
export async function getDeviceStatus(deviceId: string): Promise<{ online: boolean; lastSeen?: string }> {
  try {
    console.log(`📊 DataService: Checking device status for ${deviceId}`)

    if (!database) {
      return { online: false }
    }

    const deviceRef = ref(database, `devices/${deviceId}/current_data`)
    const snapshot = await get(deviceRef)

    if (snapshot.exists()) {
      const data = snapshot.val()
      const lastSeen = data.timestamp ? new Date(data.timestamp).toISOString() : undefined
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const online = data.timestamp ? new Date(data.timestamp).getTime() > fiveMinutesAgo : false

      return { online, lastSeen }
    }

    return { online: false }
  } catch (error) {
    console.error("🔥 DataService: Error checking device status:", error)
    return { online: false }
  }
}

// Generate report function
export function generateReport(data: HistoricalData[], startDate: string, endDate: string) {
  console.log(`📊 DataService: Generating report from ${startDate} to ${endDate}`)

  return {
    summary: {
      totalEvents: data.length,
      yawnEvents: data.filter((d) => d.yawn_events > 0).length,
      drowsinessEvents: data.filter((d) => d.drowsiness_events > 0).length,
      criticalAlerts: data.filter((d) => d.critical_alerts > 0).length,
    },
    data: data,
    period: { startDate, endDate },
  }
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
  getDeviceStatus,
  generateReport,
}
