/**
 * Data Service
 * Handles data processing, caching, and analytics for historical data
 */

import { ref, onValue, query, limitToLast } from "firebase/database"
import { database } from "./firebase"
import type { HistoricalData, DailyStats, ReportData, CacheItem } from "./types"

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000
const HISTORICAL_DATA_LIMIT = 200

/**
 * Main data service class for handling historical data operations
 */
class DataService {
  private cache = new Map<string, CacheItem<{ data: HistoricalData[]; stats: DailyStats }>>()
  private activeListeners = new Map<string, () => void>()

  /**
   * Generate cache key for data requests
   */
  private getCacheKey(deviceId: string, startDate: string, endDate: string): string {
    return `${deviceId}_${startDate}_${endDate}`
  }

  /**
   * Validate data entry
   */
  private isValidData(data: any): boolean {
    return data && data.timestamp
  }

  /**
   * Calculate comprehensive statistics from historical data
   * FIXED: รวมข้อมูลหลายวันอย่างถูกต้องแทนการใช้เฉพาะเรคอร์ดล่าสุด
   */
  private calculateStats(data: HistoricalData[]): DailyStats {
    if (!data || data.length === 0) {
      return {
        totalYawns: 0,
        totalDrowsiness: 0,
        totalAlerts: 0,
        totalSessions: 0,
        averageEAR: 0,
        averageMouthDistance: 0,
        statusDistribution: {},
      }
    }

    const validData = data.filter(this.isValidData)
    if (validData.length === 0) {
      return {
        totalYawns: 0,
        totalDrowsiness: 0,
        totalAlerts: 0,
        totalSessions: 0,
        averageEAR: 0,
        averageMouthDistance: 0,
        statusDistribution: {},
      }
    }

    // จัดกลุ่มข้อมูลตามวัน
    const dailyGroups: { [date: string]: HistoricalData[] } = {}
    validData.forEach((item) => {
      const date = new Date(item.timestamp).toDateString()
      if (!dailyGroups[date]) dailyGroups[date] = []
      dailyGroups[date].push(item)
    })

    // คำนวณข้อมูลสะสมจากแต่ละวัน
    let totalYawns = 0
    let totalDrowsiness = 0
    let totalAlerts = 0

    Object.values(dailyGroups).forEach((dayData) => {
      // เรียงข้อมูลตามเวลาและใช้เรคอร์ดล่าสุดของแต่ละวัน
      const sortedDayData = [...dayData].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      const latestOfDay = sortedDayData[0]

      // รวมข้อมูลสะสมจากแต่ละวัน
      totalYawns += latestOfDay.yawn_events || 0
      totalDrowsiness += latestOfDay.drowsiness_events || 0
      totalAlerts += latestOfDay.critical_alerts || 0
    })

    // คำนวณค่าเฉลี่ย EAR จากข้อมูลที่มีค่า > 0
    const validEARData = validData.filter(
      (item) =>
        (item.ear !== undefined && item.ear !== null && item.ear > 0) ||
        (item.ear_value !== undefined && item.ear_value !== null && item.ear_value > 0),
    )
    const averageEAR =
      validEARData.length > 0
        ? validEARData.reduce((sum, item) => sum + (item.ear || item.ear_value || 0), 0) / validEARData.length
        : 0

    // คำนวณค่าเฉลี่ย mouth distance จากข้อมูลที่มีค่า > 0
    const validMouthData = validData.filter(
      (item) => item.mouth_distance !== undefined && item.mouth_distance !== null && item.mouth_distance > 0,
    )
    const averageMouthDistance =
      validMouthData.length > 0
        ? validMouthData.reduce((sum, item) => sum + (item.mouth_distance || 0), 0) / validMouthData.length
        : 0

    // คำนวณการกระจายของสถานะ
    const statusDistribution: { [status: string]: number } = {}
    validData.forEach((item) => {
      const status = item.status || "NORMAL"
      statusDistribution[status] = (statusDistribution[status] || 0) + 1
    })

    return {
      totalYawns,
      totalDrowsiness,
      totalAlerts,
      totalSessions: this.calculateSessions(validData),
      averageEAR: Number(averageEAR.toFixed(3)),
      averageMouthDistance: Number(averageMouthDistance.toFixed(1)),
      statusDistribution,
    }
  }

  /**
   * Calculate number of driving sessions based on time gaps
   */
  private calculateSessions(data: HistoricalData[]): number {
    if (!data || data.length === 0) return 0

    let sessions = 1
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    for (let i = 1; i < sortedData.length; i++) {
      const currentTime = new Date(sortedData[i].timestamp).getTime()
      const prevTime = new Date(sortedData[i - 1].timestamp).getTime()

      // If gap is more than 10 minutes, consider it a new session
      if (currentTime - prevTime > 10 * 60 * 1000) {
        sessions++
      }
    }

    return sessions
  }

  /**
   * Calculate trends for report generation
   */
  private calculateTrends(data: HistoricalData[]): {
    yawnTrend: string
    drowsinessTrend: string
    alertnessTrend: string
  } {
    if (!data || data.length < 2) {
      return {
        yawnTrend: "stable",
        drowsinessTrend: "stable",
        alertnessTrend: "stable",
      }
    }

    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const midPoint = Math.floor(sortedData.length / 2)

    const firstHalf = sortedData.slice(0, midPoint)
    const secondHalf = sortedData.slice(midPoint)

    // Count events in each half
    let firstHalfYawns = 0
    let firstHalfDrowsiness = 0
    let secondHalfYawns = 0
    let secondHalfDrowsiness = 0

    firstHalf.forEach((item) => {
      if (item.status === "YAWN DETECTED") firstHalfYawns++
      else if (item.status === "DROWSINESS DETECTED") firstHalfDrowsiness++
    })

    secondHalf.forEach((item) => {
      if (item.status === "YAWN DETECTED") secondHalfYawns++
      else if (item.status === "DROWSINESS DETECTED") secondHalfDrowsiness++
    })

    const yawnTrend =
      secondHalfYawns > firstHalfYawns ? "increasing" : secondHalfYawns < firstHalfYawns ? "decreasing" : "stable"

    const drowsinessTrend =
      secondHalfDrowsiness > firstHalfDrowsiness
        ? "increasing"
        : secondHalfDrowsiness < firstHalfDrowsiness
          ? "decreasing"
          : "stable"

    // Calculate average EAR for alertness trend
    const firstHalfEarData = firstHalf.filter((item) => (item.ear || 0) > 0)
    const secondHalfEarData = secondHalf.filter((item) => (item.ear || 0) > 0)

    const firstHalfAvgEar =
      firstHalfEarData.length > 0
        ? firstHalfEarData.reduce((sum, item) => sum + (item.ear || 0), 0) / firstHalfEarData.length
        : 0

    const secondHalfAvgEar =
      secondHalfEarData.length > 0
        ? secondHalfEarData.reduce((sum, item) => sum + (item.ear || 0), 0) / secondHalfEarData.length
        : 0

    const alertnessTrend =
      secondHalfAvgEar > firstHalfAvgEar ? "improving" : secondHalfAvgEar < firstHalfAvgEar ? "declining" : "stable"

    return { yawnTrend, drowsinessTrend, alertnessTrend }
  }

  /**
   * Generate safety recommendations based on statistics
   * FIXED: Aligned recommendation logic with safety score calculation
   */
  private generateRecommendations(stats: DailyStats): string[] {
    const recommendations: string[] = []

    if (stats.totalAlerts > 0) {
      recommendations.push("พบการแจ้งเตือนด่วน ควรหยุดพักทันทีและปรึกษาแพทย์หากอาการดังกล่าวเกิดขึ้นบ่อย")
    }

    if (stats.totalDrowsiness > 5) {
      recommendations.push("มีการง่วงนอนบ่อย ควรตรวจสอบคุณภาพการนอนหลับและหลีกเลี่ยงการขับขี่ในช่วงเวลาที่เสี่ยง")
    }

    if (stats.totalYawns > 15) {
      recommendations.push("มีการหาวบ่อย อาจเป็นสัญญาณของความเหนื่อยล้า ควรหยุดพักทุก 2 ชั่วโมง")
    }

    if (stats.averageEAR < 0.25) {
      recommendations.push("ค่าเฉลี่ย EAR ต่ำ แสดงว่าตาปิดบ่อย ควรตรวจสอบสภาพร่างกายและหลีกเลี่ยงการขับขี่เมื่อเหนื่อยล้า")
    }

    if (stats.totalSessions > 5) {
      recommendations.push("มีการใช้งานหลายเซสชัน ควรจำกัดเวลาการขับขี่ต่อเนื่องและหยุดพักให้เพียงพอ")
    }

    if (recommendations.length === 0) {
      recommendations.push("พฤติกรรมการขับขี่ของคุณอยู่ในเกณฑ์ดี ควรรักษาระดับความตื่นตัวและหยุดพักตามปกติ")
    }

    return recommendations
  }

  /**
   * Subscribe to historical data with caching
   * Main method for components to get historical data
   */
  subscribeToHistoricalDataWithCache(
    deviceId: string,
    startDate: string,
    endDate: string,
    callback: (data: HistoricalData[], stats: DailyStats) => void,
  ): () => void {
    const cacheKey = this.getCacheKey(deviceId, startDate, endDate)

    console.log("🔥 DataService: subscribeToHistoricalDataWithCache called", {
      deviceId,
      startDate,
      endDate,
      cacheKey,
      cacheExists: this.cache.has(cacheKey),
      activeListeners: this.activeListeners.size,
    })

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("📦 DataService: Using cached data for", cacheKey)
      setTimeout(() => callback(cached.data.data, cached.data.stats), 0)
      return () => {}
    }

    // Cleanup existing listener
    this.cleanup(cacheKey)

    console.log("🔥 DataService: Creating new Firebase listener for", cacheKey)

    if (!database) {
      console.warn("⚠️ Firebase database not available, returning empty data")
      const emptyStats = this.calculateStats([])
      this.cache.set(cacheKey, {
        data: { data: [], stats: emptyStats },
        timestamp: Date.now(),
        key: cacheKey,
      })
      setTimeout(() => callback([], emptyStats), 0)
      return () => {}
    }

    try {
      const historicalRef = ref(database, `devices/${deviceId}/history`)
      const limitedQuery = query(historicalRef, limitToLast(HISTORICAL_DATA_LIMIT))

      const unsubscribe = onValue(
        limitedQuery,
        (snapshot) => {
          if (snapshot.exists()) {
            const rawData = snapshot.val()

            if (!rawData || typeof rawData !== "object") {
              console.warn("⚠️ Invalid rawData from Firebase:", rawData)
              const emptyStats = this.calculateStats([])
              this.cache.set(cacheKey, {
                data: { data: [], stats: emptyStats },
                timestamp: Date.now(),
                key: cacheKey,
              })
              callback([], emptyStats)
              return
            }

            // Transform Firebase data to HistoricalData format
            const data: HistoricalData[] = Object.entries(rawData)
              .map(([key, value]: [string, any]) => {
                if (!value || typeof value !== "object" || !value.timestamp) {
                  return null
                }

                return {
                  id: key,
                  timestamp: value.timestamp,
                  ear: value.ear || 0,
                  ear_value: value.ear || 0,
                  yawn_events: value.yawn_events || 0,
                  drowsiness_events: value.drowsiness_events || 0,
                  critical_alerts: value.critical_alerts || 0,
                  device_id: value.device_id || deviceId,
                  status: value.status || "NORMAL",
                  mouth_distance: value.mouth_distance || 0,
                  face_detected_frames: value.face_detected_frames || 0,
                }
              })
              .filter((item): item is HistoricalData => item !== null)
              .filter((item) => {
                // Filter by date range
                const itemDate = new Date(item.timestamp)
                const start = new Date(startDate)
                const end = new Date(endDate)
                return itemDate >= start && itemDate <= end
              })
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

            const stats = this.calculateStats(data)

            // Cache the data
            if (Array.isArray(data)) {
              this.cache.set(cacheKey, {
                data: { data, stats },
                timestamp: Date.now(),
                key: cacheKey,
              })
              callback(data, stats)
            } else {
              console.error("❌ Processed data is not an array:", data)
              const emptyStats = this.calculateStats([])
              this.cache.set(cacheKey, {
                data: { data: [], stats: emptyStats },
                timestamp: Date.now(),
                key: cacheKey,
              })
              callback([], emptyStats)
            }
          } else {
            console.log("📭 No data found for", cacheKey)
            const emptyStats = this.calculateStats([])
            this.cache.set(cacheKey, {
              data: { data: [], stats: emptyStats },
              timestamp: Date.now(),
              key: cacheKey,
            })
            callback([], emptyStats)
          }
        },
        (error) => {
          console.error("❌ Firebase error:", error)
          const emptyStats = this.calculateStats([])
          callback([], emptyStats)
        },
      )

      // Store listener for cleanup
      this.activeListeners.set(cacheKey, unsubscribe)

      return () => this.cleanup(cacheKey)
    } catch (error) {
      console.error("❌ Error creating Firebase listener:", error)
      const emptyStats = this.calculateStats([])
      callback([], emptyStats)
      return () => {}
    }
  }

  /**
   * Generate comprehensive report from historical data
   */
  generateReport(data: HistoricalData[], period: "daily" | "weekly" | "monthly"): ReportData {
    const stats = this.calculateStats(data)
    const trends = this.calculateTrends(data)
    const recommendations = this.generateRecommendations(stats)

    return {
      stats,
      trends,
      recommendations,
    }
  }

  /**
   * Calculate safety score based on statistics
   * FIXED: Standardized safety score calculation across the application
   */
  calculateSafetyScore(stats: DailyStats): number {
    let score = 100

    // Deduct points for yawns (max 30 points)
    score -= Math.min(stats.totalYawns * 2, 30)

    // Deduct points for drowsiness (max 40 points)
    score -= Math.min(stats.totalDrowsiness * 5, 40)

    // Deduct points for alerts (max 50 points)
    score -= Math.min(stats.totalAlerts * 10, 50)

    // Deduct points for low EAR
    if (stats.averageEAR < 0.25) {
      score -= 20
    } else if (stats.averageEAR < 0.3) {
      score -= 10
    }

    return Math.max(score, 0)
  }

  /**
   * Cleanup specific listener
   */
  private cleanup(cacheKey: string) {
    const unsubscribe = this.activeListeners.get(cacheKey)
    if (unsubscribe) {
      console.log("🧹 Cleaning up listener for", cacheKey)
      unsubscribe()
      this.activeListeners.delete(cacheKey)
    }
  }

  /**
   * Cleanup all active listeners
   */
  cleanupAll() {
    console.log(`🧹 Cleaning up ${this.activeListeners.size} Firebase listeners`)
    this.activeListeners.forEach((unsubscribe, key) => {
      console.log("🧹 Cleaning up listener:", key)
      unsubscribe()
    })
    this.activeListeners.clear()
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    console.log("🗑️ Clearing data cache")
    this.cache.clear()
  }

  /**
   * Get number of active listeners
   */
  getActiveListenersCount(): number {
    return this.activeListeners.size
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const dataService = new DataService()

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    dataService.cleanupAll()
  })
}

console.log("🔥 Data service initialized")
