/**
 * Data Service
 * Handles data processing, caching, and analytics.
 * FIXED: Calculation logic now uses the /alerts collection for accurate event counting,
 * ensuring consistency across the entire application.
 */

import { ref, get, query, limitToLast, orderByChild, equalTo } from "firebase/database";
import { database } from "./firebase";
import type { HistoricalData, DailyStats, ReportData, CacheItem } from "./types";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const HISTORICAL_DATA_LIMIT = 500;

class DataService {
  private cache = new Map<string, CacheItem<{ data: HistoricalData[]; stats: DailyStats }>>();

  private getCacheKey(deviceId: string, startDate: string, endDate: string): string {
    return `${deviceId}_${startDate}_${endDate}`;
  }

  /**
   * CORRECTED: Calculates stats by counting individual alerts, not summing cumulative history.
   */
  private calculateStats(historicalData: HistoricalData[], filteredAlerts: any[]): DailyStats {
    if (!historicalData && !filteredAlerts) {
      return { totalYawns: 0, totalDrowsiness: 0, totalAlerts: 0, totalSessions: 0, averageEAR: 0, averageMouthDistance: 0, statusDistribution: {} };
    }

    // 1. Count events directly from the filtered alerts collection for accuracy.
    const totalYawns = filteredAlerts.filter(a => a.alert_type === 'yawn_detected').length;
    const totalDrowsiness = filteredAlerts.filter(a => a.alert_type === 'drowsiness_detected').length;
    const totalAlerts = filteredAlerts.filter(a => a.alert_type === 'critical_drowsiness').length;

    // 2. Calculate other metrics from the history collection.
    const validHistory = historicalData.filter(item => item && item.timestamp);
    const validEARData = validHistory.filter(item => (item.ear ?? item.ear_value ?? 0) > 0);
    const averageEAR =
      validEARData.length > 0
        ? validEARData.reduce((sum, item) => sum + (item.ear || item.ear_value || 0), 0) / validEARData.length
        : 0;

    const validMouthData = validHistory.filter(item => (item.mouth_distance ?? 0) > 0);
    const averageMouthDistance =
      validMouthData.length > 0
        ? validMouthData.reduce((sum, item) => sum + (item.mouth_distance || 0), 0) / validMouthData.length
        : 0;
    
    const statusDistribution: { [status: string]: number } = {};
    validHistory.forEach((item) => {
      const status = item.status || "NORMAL";
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    return {
      totalYawns,
      totalDrowsiness,
      totalAlerts,
      totalSessions: this.calculateSessions(validHistory),
      averageEAR: Number(averageEAR.toFixed(3)),
      averageMouthDistance: Number(averageMouthDistance.toFixed(1)),
      statusDistribution,
    };
  }
  
  private calculateSessions(data: HistoricalData[]): number {
    if (!data || data.length === 0) return 0;
    let sessions = 1;
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (let i = 1; i < sortedData.length; i++) {
      const currentTime = new Date(sortedData[i].timestamp).getTime();
      const prevTime = new Date(sortedData[i - 1].timestamp).getTime();
      if (currentTime - prevTime > 10 * 60 * 1000) {
        sessions++;
      }
    }
    return sessions;
  }
  
  /**
   * Subscribes to historical data, using a cache to avoid redundant fetches.
   * This is the main function used by front-end components.
   */
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
            if (!database) throw new Error("Firebase not available");

            const historyRef = ref(database, `devices/${deviceId}/history`);
            const alertsRef = ref(database, "alerts");
            
            const alertsQuery = query(alertsRef, orderByChild('device_id'), equalTo(deviceId));

            const [historySnapshot, alertsSnapshot] = await Promise.all([
                get(query(historyRef, limitToLast(HISTORICAL_DATA_LIMIT * 5))),
                get(alertsQuery)
            ]);
            
            const historicalData: HistoricalData[] = [];
            if (historySnapshot.exists()) {
                Object.entries(historySnapshot.val()).forEach(([key, value]: [string, any]) => {
                    historicalData.push({ id: key, ...value });
                });
            }

            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();

            const filteredHistoricalData = historicalData
                .filter(item => {
                    const itemTime = new Date(item.timestamp).getTime();
                    return itemTime >= start && itemTime <= end;
                })
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            let filteredAlerts: any[] = [];
            if (alertsSnapshot.exists()) {
                const allAlerts = Object.values(alertsSnapshot.val());
                filteredAlerts = allAlerts.filter((alert: any) => {
                    const alertTime = new Date(alert.timestamp).getTime();
                    return alertTime >= start && alertTime <= end;
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

export const dataService = new DataService();
console.log("🔥 Data service initialized with CORRECTED calculation logic.");
