/**
 * Data Service
 * Handles data processing, caching, and analytics.
 * FIXED: Calculation logic now uses the /alerts collection for accurate event counting,
 * ensuring consistency with the Admin Dashboard.
 */

import { ref, onValue, get, query, limitToLast } from "firebase/database"
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

  private getCacheKey(deviceId: string, startDate: string, endDate: string): string {
    return `${deviceId}_${startDate}_${endDate}`
  }

  /**
   * Calculate comprehensive statistics from historical data and alerts.
   * This is the corrected calculation logic.
   */
  private calculateStats(historicalData: HistoricalData[], filteredAlerts: any[]): DailyStats {
    if (!historicalData && !filteredAlerts) {
      return { totalYawns: 0, totalDrowsiness: 0, totalAlerts: 0, totalSessions: 0, averageEAR: 0, averageMouthDistance: 0, statusDistribution: {} };
    }

    // 1. Calculate event counts directly from the filtered alerts collection
    const totalYawns = filteredAlerts.filter(a => a.alert_type === 'yawn_detected').length;
    const totalDrowsiness = filteredAlerts.filter(a => a.alert_type === 'drowsiness_detected').length;
    const totalAlerts = filteredAlerts.filter(a => a.alert_type === 'critical_drowsiness').length;

    // 2. Calculate other metrics from the history collection
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
    
    // 3. Calculate status distribution from history
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

  /**
   * Subscribe to historical data with caching
   * This is the main method for components to get historical data
   */
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

    this.cleanup(cacheKey)

    console.log("🔥 DataService: Creating new Firebase listener for", cacheKey);

    const fetchData = async () => {
        try {
            if (!database) throw new Error("Firebase not available");

            const historyRef = ref(database, `devices/${deviceId}/history`);
            const alertsRef = ref(database, "alerts");

            const [historySnapshot, alertsSnapshot] = await Promise.all([
                get(query(historyRef, limitToLast(HISTORICAL_DATA_LIMIT * 5))), // Fetch more history to ensure EAR coverage
                get(alertsRef)
            ]);
            
            // Process History Data (for EAR, etc.)
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

            // Process and Filter Alerts Data (for event counts)
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
            
            // Calculate stats using the new, correct method
            const stats = this.calculateStats(filteredHistoricalData, filteredAlerts);

            this.cache.set(cacheKey, { data: { data: filteredHistoricalData, stats }, timestamp: Date.now(), key: cacheKey });
            callback(filteredHistoricalData, stats);
        } catch (error) {
            console.error("❌ DataService: Error fetching data:", error);
            const emptyStats = this.calculateStats([], []);
            callback([], emptyStats);
        }
    };
    
    fetchData(); // Run once, since we don't need real-time updates for reports.

    // Return an empty cleanup function as we are using get() instead of onValue()
    return () => {};
  }
  
  private cleanup(cacheKey: string) {
    // No-op for now as we switched to get(), but keeping the structure
  }
  
  cleanupAll() {
    // No-op
  }

  clearCache() {
    console.log("🗑️ Clearing data cache");
    this.cache.clear();
  }
}

export const dataService = new DataService()
console.log("🔥 Data service initialized with CORRECTED calculation logic.")
