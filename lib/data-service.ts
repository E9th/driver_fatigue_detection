/**
 * Data Service
 * Handles data processing, caching, and analytics.
 * Added more detailed logging for debugging.
 */

import { ref, onValue, get, query, limitToLast, orderByChild, equalTo, startAt, endAt } from "firebase/database";
import { database } from "./firebase";
import type { HistoricalData, DailyStats, ReportData, CacheItem, SafetyData } from "./types"; // Added SafetyData

const CACHE_DURATION = 5 * 60 * 1000;
const HISTORICAL_DATA_LIMIT = 500;

export async function getUsedDeviceIds(): Promise<string[]> {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
        const users = snapshot.val();
        return Object.values(users).map((user: any) => user.deviceId).filter(Boolean);
    }
    return [];
}

// ... ฟังก์ชันอื่นๆ ...

class DataService {
  private cache = new Map<string, CacheItem<{ data: HistoricalData[]; stats: DailyStats }>>();
  
  private getCacheKey(deviceId: string, startDate: string, endDate: string): string {
    return `${deviceId}_${startDate}_${endDate}`;
  }

  private calculateStats(historicalData: HistoricalData[], filteredAlerts: any[]): DailyStats {
    const totalYawns = filteredAlerts.filter(a => a.alert_type === 'yawn_detected').length;
    const totalDrowsiness = filteredAlerts.filter(a => a.alert_type === 'drowsiness_detected').length;
    const totalAlerts = filteredAlerts.filter(a => a.alert_type === 'critical_drowsiness').length;

    const validHistory = historicalData.filter(item => item && item.timestamp);
    const validEARData = validHistory.filter(item => (item.ear ?? item.ear_value ?? 0) > 0);
    const averageEAR =
      validEARData.length > 0
        ? validEARData.reduce((sum, item) => sum + (item.ear || item.ear_value || 0), 0) / validEARData.length
        : 0;
    
    const stats: DailyStats = {
      totalYawns,
      totalDrowsiness,
      totalAlerts,
      totalSessions: 0, // Simplified, can be re-implemented if needed
      averageEAR: Number(averageEAR.toFixed(3)),
      averageMouthDistance: 0, // Simplified
      statusDistribution: {}, // Simplified
    };
    
    console.log("📊 Stats Calculated:", stats); // ADDED LOG
    return stats;
  }

  public calculateSafetyScore(stats: DailyStats): number {
    let score = 100;
    score -= Math.min((stats.totalYawns || 0) * 2, 30);
    score -= Math.min((stats.totalDrowsiness || 0) * 5, 40);
    score -= Math.min((stats.totalAlerts || 0) * 10, 50);
    if ((stats.averageEAR || 0) > 0 && stats.averageEAR < 0.25) score -= 20;
    else if ((stats.averageEAR || 0) > 0 && stats.averageEAR < 0.3) score -= 10;
    return Math.max(0, Math.round(score));
  }
  
  public generateReport(data: HistoricalData[], stats: DailyStats): ReportData {
      // Dummy implementation, can be expanded
      return {
          stats: stats,
          trends: { yawnTrend: 'stable', drowsinessTrend: 'stable', alertnessTrend: 'stable' },
          recommendations: ['ขับขี่อย่างปลอดภัยและหยุดพักเมื่อจำเป็น']
      };
  }

  subscribeToHistoricalDataWithCache(
    deviceId: string,
    startDate: string,
    endDate: string,
    callback: (data: HistoricalData[], stats: DailyStats) => void,
  ): () => void {
    const cacheKey = this.getCacheKey(deviceId, startDate, endDate);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("📦 DataService: Using cached data for", cacheKey);
      setTimeout(() => callback(cached.data.data, cached.data.stats), 0);
      return () => {};
    }
    
    console.log("🔥 DataService: Fetching new data for", cacheKey);
    
    const fetchData = async () => {
        try {
            if (!database) throw new Error("Firebase DB not available");

            const historyQuery = query(ref(database, `devices/${deviceId}/history`), orderByChild('timestamp'), startAt(startDate), endAt(endDate));
            const alertsQuery = query(ref(database, 'alerts'), orderByChild('device_id'), equalTo(deviceId));

            const [historySnapshot, alertsSnapshot] = await Promise.all([
                get(historyQuery),
                get(alertsQuery)
            ]);
            
            const historicalData: HistoricalData[] = [];
            if(historySnapshot.exists()){
                Object.entries(historySnapshot.val()).forEach(([key, value]) => {
                    historicalData.push({ id: key, ...(value as any) });
                });
            }

            const allAlerts = alertsSnapshot.exists() ? Object.values(alertsSnapshot.val()) : [];
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();
            const filteredAlerts = allAlerts.filter((alert: any) => {
                const alertTime = new Date(alert.timestamp).getTime();
                return alertTime >= start && alertTime <= end;
            });
            
            const stats = this.calculateStats(historicalData, filteredAlerts);
            this.cache.set(cacheKey, { data: { data: historicalData, stats }, timestamp: Date.now(), key: cacheKey });
            callback(historicalData, stats);

        } catch (error) {
            console.error("❌ DataService: Error fetching data:", error);
            callback([], this.calculateStats([], []));
        }
    };
    
    fetchData();

    return () => {};
  }

  clearCache() {
    this.cache.clear();
    console.log("🗑️ Cache cleared.");
  }
}

export const dataService = new DataService();
console.log("🔥 Data service initialized with CORRECTED query logic.");
