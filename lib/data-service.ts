/**
 * Data Service
 * Handles data processing, caching, and analytics.
 * RE-ADDED the generateReport function and other helper methods.
 */

import { ref, get, query, limitToLast } from "firebase/database"
import { database } from "./firebase"
import type { HistoricalData, DailyStats, ReportData, CacheItem } from "./types"

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const HISTORICAL_DATA_LIMIT = 200

class DataService {
  private cache = new Map<string, CacheItem<{ data: HistoricalData[]; stats: DailyStats }>>()

  private getCacheKey(deviceId: string, startDate: string, endDate: string): string {
    return `${deviceId}_${startDate}_${endDate}`
  }

  private calculateStats(historicalData: HistoricalData[], filteredAlerts: any[]): DailyStats {
    const totalYawns = filteredAlerts.filter(a => a.alert_type === 'yawn_detected').length
    const totalDrowsiness = filteredAlerts.filter(a => a.alert_type === 'drowsiness_detected').length
    const totalAlerts = filteredAlerts.filter(a => a.alert_type === 'critical_drowsiness').length

    const validHistory = historicalData.filter(item => item && item.timestamp)
    const validEARData = validHistory.filter(item => (item.ear ?? item.ear_value ?? 0) > 0)
    const averageEAR =
      validEARData.length > 0
        ? validEARData.reduce((sum, item) => sum + (item.ear || item.ear_value || 0), 0) / validEARData.length
        : 0

    const validMouthData = validHistory.filter(item => (item.mouth_distance ?? 0) > 0)
    const averageMouthDistance =
      validMouthData.length > 0
        ? validMouthData.reduce((sum, item) => sum + (item.mouth_distance || 0), 0) / validMouthData.length
        : 0

    const statusDistribution: { [status: string]: number } = {}
    validHistory.forEach((item) => {
      const status = item.status || "NORMAL"
      statusDistribution[status] = (statusDistribution[status] || 0) + 1
    })

    return {
      totalYawns,
      totalDrowsiness,
      totalAlerts,
      totalSessions: this.calculateSessions(validHistory),
      averageEAR: Number(averageEAR.toFixed(3)),
      averageMouthDistance: Number(averageMouthDistance.toFixed(1)),
      statusDistribution,
    }
  }

  private calculateSessions(data: HistoricalData[]): number {
    if (!data || data.length === 0) return 0
    let sessions = 1
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    for (let i = 1; i < sortedData.length; i++) {
      const currentTime = new Date(sortedData[i].timestamp).getTime()
      const prevTime = new Date(sortedData[i - 1].timestamp).getTime()
      if (currentTime - prevTime > 10 * 60 * 1000) {
        sessions++
      }
    }
    return sessions
  }
  
  private calculateTrends(data: HistoricalData[]): { yawnTrend: string; drowsinessTrend: string; alertnessTrend: string; } {
    if (!data || data.length < 2) {
      return { yawnTrend: "stable", drowsinessTrend: "stable", alertnessTrend: "stable" };
    }
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const midPoint = Math.floor(sortedData.length / 2);
    const firstHalf = sortedData.slice(0, midPoint);
    const secondHalf = sortedData.slice(midPoint);

    const countEvents = (arr: HistoricalData[]) => arr.reduce((acc, item) => {
      if (item.status === "YAWN DETECTED") acc.yawns++;
      if (item.status === "DROWSINESS DETECTED" || item.status.includes("CRITICAL")) acc.drowsiness++;
      return acc;
    }, { yawns: 0, drowsiness: 0 });

    const firstHalfEvents = countEvents(firstHalf);
    const secondHalfEvents = countEvents(secondHalf);
    
    const getAvgEar = (arr: HistoricalData[]) => {
        const earData = arr.filter(d => (d.ear ?? 0) > 0);
        return earData.length > 0 ? earData.reduce((sum, d) => sum + (d.ear ?? 0), 0) / earData.length : 0;
    }

    const firstHalfAvgEar = getAvgEar(firstHalf);
    const secondHalfAvgEar = getAvgEar(secondHalf);

    return {
        yawnTrend: secondHalfEvents.yawns > firstHalfEvents.yawns ? 'increasing' : secondHalfEvents.yawns < firstHalfEvents.yawns ? 'decreasing' : 'stable',
        drowsinessTrend: secondHalfEvents.drowsiness > firstHalfEvents.drowsiness ? 'increasing' : secondHalfEvents.drowsiness < firstHalfEvents.drowsiness ? 'decreasing' : 'stable',
        alertnessTrend: secondHalfAvgEar > firstHalfAvgEar ? 'improving' : secondHalfAvgEar < firstHalfAvgEar ? 'declining' : 'stable',
    };
  }

  private generateRecommendations(stats: DailyStats): string[] {
    const recommendations: string[] = [];
    if (stats.totalAlerts > 0) {
      recommendations.push("พบการแจ้งเตือนระดับวิกฤต ควรหยุดพักทันทีและตรวจสอบความพร้อมของร่างกาย");
    }
    if (stats.totalDrowsiness > 5) {
      recommendations.push("มีอาการง่วงบ่อยครั้ง ควรวางแผนการพักผ่อนให้เพียงพอก่อนการเดินทาง");
    }
    if (stats.totalYawns > 15) {
      recommendations.push("มีการหาวบ่อยครั้ง อาจเป็นสัญญาณของความเหนื่อยล้าสะสม ควรหยุดพักทุก 2 ชั่วโมง");
    }
    if (stats.averageEAR < 0.25 && stats.averageEAR > 0) {
      recommendations.push("ค่าเฉลี่ย EAR ค่อนข้างต่ำ บ่งบอกถึงดวงตาที่อ่อนล้า");
    }
    if (recommendations.length === 0) {
      recommendations.push("ยอดเยี่ยม! พฤติกรรมการขับขี่ของคุณอยู่ในเกณฑ์ปลอดภัยมาก");
    }
    return recommendations;
  }

  public generateReport(data: HistoricalData[], stats: DailyStats): ReportData {
    const trends = this.calculateTrends(data);
    const recommendations = this.generateRecommendations(stats);
    return {
      stats,
      trends,
      recommendations,
    };
  }

  subscribeToHistoricalDataWithCache(
    deviceId: string,
    startDate: string,
    endDate: string,
    callback: (data: HistoricalData[], stats: DailyStats) => void,
  ): () => void {
    const cacheKey = this.getCacheKey(deviceId, startDate, endDate)
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("📦 DataService: Using cached data for", cacheKey)
      setTimeout(() => callback(cached.data.data, cached.data.stats), 0)
      return () => {}
    }

    console.log("🔥 DataService: Fetching new data for", cacheKey);

    const fetchData = async () => {
        try {
            if (!database) throw new Error("Firebase not available");

            const historyRef = ref(database, `devices/${deviceId}/history`);
            const alertsRef = ref(database, "alerts");

            const [historySnapshot, alertsSnapshot] = await Promise.all([
                get(query(historyRef, limitToLast(HISTORICAL_DATA_LIMIT * 5))),
                get(alertsRef)
            ]);
            
            const historicalData: HistoricalData[] = [];
            if (historySnapshot.exists()) {
                const rawHistory = historySnapshot.val();
                Object.entries(rawHistory).forEach(([key, value]: [string, any]) => {
                    historicalData.push({ id: key, ...value });
                });
            }
            const filteredHistoricalData = historicalData
                .filter(item => {
                    const itemTime = new Date(item.timestamp).getTime();
                    return itemTime >= new Date(startDate).getTime() && itemTime <= new Date(endDate).getTime();
                })
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            let filteredAlerts: any[] = [];
            if (alertsSnapshot.exists()) {
                const allAlerts = Object.values(alertsSnapshot.val());
                filteredAlerts = allAlerts.filter((alert: any) => {
                    const alertTime = new Date(alert.timestamp).getTime();
                    return alert.device_id === deviceId &&
                           alertTime >= new Date(startDate).getTime() &&
                           alertTime <= new Date(endDate).getTime();
                });
            }
            
            const stats = this.calculateStats(filteredHistoricalData, filteredAlerts);

            this.cache.set(cacheKey, { data: { data: filteredHistoricalData, stats }, timestamp: Date.now(), key: cacheKey });
            callback(filteredHistoricalData, stats);
        } catch (error) {
            console.error("❌ DataService: Error fetching data:", error);
            const emptyStats = this.calculateStats([], []);
            callback([], emptyStats);
        }
    };
    
    fetchData();

    return () => {};
  }
  
  clearCache() {
    console.log("🗑️ Clearing data cache");
    this.cache.clear();
  }
}

export const dataService = new DataService()
console.log("🔥 Data service initialized with CORRECTED calculation logic.")
