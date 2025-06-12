import {
  ref,
  onValue,
  query,
  limitToLast,
  orderByChild,
  startAt,
  endAt,
  get,
  type DatabaseReference,
} from "firebase/database"
import { database } from "./firebase-singleton"

// Performance Configuration
const PERFORMANCE_CONFIG = {
  CACHE_DURATION: 2 * 60 * 1000, // 2 minutes (ลดจาก 5 นาที)
  MAX_LISTENERS: 5, // ลดจาก 10
  THROTTLE_DELAY: 500, // ลดจาก 2000ms
  BATCH_SIZE: 20, // ลดจาก 50
  PREFETCH_SIZE: 10,
  CONNECTION_TIMEOUT: 5000,
  RETRY_ATTEMPTS: 2,
}

// Advanced Cache with LRU eviction
class AdvancedCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; accessCount: number }>()
  private maxSize: number
  private hitCount = 0
  private missCount = 0

  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (item && Date.now() - item.timestamp < PERFORMANCE_CONFIG.CACHE_DURATION) {
      item.accessCount++
      this.hitCount++
      return item.data
    }
    this.missCount++
    return null
  }

  set(key: string, data: T): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
    })
  }

  private evictLRU(): void {
    let oldestKey = ""
    let oldestTime = Date.now()
    let lowestAccess = Number.POSITIVE_INFINITY

    this.cache.forEach((value, key) => {
      if (value.timestamp < oldestTime || value.accessCount < lowestAccess) {
        oldestKey = key
        oldestTime = value.timestamp
        lowestAccess = value.accessCount
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
    }
  }

  clear(): void {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
  }
}

// Connection Pool Manager
class ConnectionPoolManager {
  private connections = new Map<string, DatabaseReference>()
  private listeners = new Map<string, () => void>()
  private connectionCount = 0

  getConnection(path: string): DatabaseReference {
    if (!this.connections.has(path)) {
      const connection = ref(database, path)
      this.connections.set(path, connection)
      this.connectionCount++
    }
    return this.connections.get(path)!
  }

  addListener(key: string, unsubscribe: () => void): void {
    // Remove existing listener if any
    this.removeListener(key)
    this.listeners.set(key, unsubscribe)
  }

  removeListener(key: string): void {
    const unsubscribe = this.listeners.get(key)
    if (unsubscribe) {
      unsubscribe()
      this.listeners.delete(key)
    }
  }

  cleanup(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe())
    this.listeners.clear()
    this.connections.clear()
    this.connectionCount = 0
  }

  getStats() {
    return {
      connections: this.connectionCount,
      activeListeners: this.listeners.size,
    }
  }
}

// High-Performance Firebase Service
class HighPerformanceFirebaseService {
  private cache = new AdvancedCache(100)
  private connectionPool = new ConnectionPoolManager()
  private pendingRequests = new Map<string, Promise<any>>()
  private prefetchQueue = new Set<string>()

  // Optimized current data subscription with aggressive caching
  subscribeToCurrentData(
    deviceId: string,
    callback: (data: any) => void,
    options: { priority?: "high" | "normal"; prefetch?: boolean } = {},
  ): () => void {
    const { priority = "normal", prefetch = false } = options
    const cacheKey = `current_${deviceId}`
    const listenerKey = `current_listener_${deviceId}`

    // Check cache first
    const cachedData = this.cache.get(cacheKey)
    if (cachedData) {
      console.log(`⚡ Using cached current data for ${deviceId}`)
      setTimeout(() => callback(cachedData), 0)

      // Still subscribe for updates but with lower priority
      if (!prefetch) {
        this.subscribeToUpdates(deviceId, callback, listenerKey)
      }
      return () => this.connectionPool.removeListener(listenerKey)
    }

    // Create optimized query
    const connection = this.connectionPool.getConnection(`devices/${deviceId}/current_data`)

    // Use throttled callback for high-frequency updates
    const throttledCallback = this.createThrottledCallback(
      (snapshot: any) => {
        const data = snapshot.val()
        if (data) {
          this.cache.set(cacheKey, data)
          callback(data)

          // Prefetch related data if enabled
          if (prefetch) {
            this.prefetchRelatedData(deviceId)
          }
        }
      },
      priority === "high" ? 200 : PERFORMANCE_CONFIG.THROTTLE_DELAY,
    )

    const unsubscribe = onValue(connection, throttledCallback, (error) => {
      console.error(`❌ Firebase error for ${deviceId}:`, error)
      callback(null)
    })

    this.connectionPool.addListener(listenerKey, unsubscribe)
    return () => this.connectionPool.removeListener(listenerKey)
  }

  // Optimized historical data with smart pagination
  async getHistoricalData(
    deviceId: string,
    startDate: string,
    endDate: string,
    options: { limit?: number; useCache?: boolean; priority?: "high" | "normal" } = {},
  ): Promise<any[]> {
    const { limit = PERFORMANCE_CONFIG.BATCH_SIZE, useCache = true, priority = "normal" } = options
    const cacheKey = `history_${deviceId}_${startDate}_${endDate}_${limit}`

    // Check cache
    if (useCache) {
      const cachedData = this.cache.get(cacheKey)
      if (cachedData) {
        console.log(`⚡ Using cached historical data for ${deviceId}`)
        return cachedData
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending request: ${cacheKey}`)
      return this.pendingRequests.get(cacheKey)!
    }

    // Create optimized query with date range
    const startTimestamp = new Date(startDate).getTime()
    const endTimestamp = new Date(endDate).getTime()

    const historyRef = ref(database, `devices/${deviceId}/history`)
    const optimizedQuery = query(
      historyRef,
      orderByChild("timestamp"),
      startAt(startDate),
      endAt(endDate),
      limitToLast(limit),
    )

    const requestPromise = this.executeWithTimeout(get(optimizedQuery), PERFORMANCE_CONFIG.CONNECTION_TIMEOUT)
      .then((snapshot) => {
        const data: any[] = []
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const childData = childSnapshot.val()
            if (childData && childData.timestamp) {
              const itemTime = new Date(childData.timestamp).getTime()
              if (itemTime >= startTimestamp && itemTime <= endTimestamp) {
                data.push({
                  id: childSnapshot.key,
                  ...childData,
                })
              }
            }
            return false
          })
        }

        // Sort by timestamp (newest first)
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        // Cache the result
        if (useCache) {
          this.cache.set(cacheKey, data)
        }

        console.log(`⚡ Loaded ${data.length} historical records for ${deviceId}`)
        return data
      })
      .catch((error) => {
        console.error(`❌ Error loading historical data for ${deviceId}:`, error)
        return []
      })
      .finally(() => {
        this.pendingRequests.delete(cacheKey)
      })

    this.pendingRequests.set(cacheKey, requestPromise)
    return requestPromise
  }

  // Batch load multiple devices
  async batchLoadCurrentData(deviceIds: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>()
    const promises = deviceIds.map(async (deviceId) => {
      const cacheKey = `current_${deviceId}`

      // Check cache first
      const cachedData = this.cache.get(cacheKey)
      if (cachedData) {
        results.set(deviceId, cachedData)
        return
      }

      // Load from Firebase
      try {
        const connection = this.connectionPool.getConnection(`devices/${deviceId}/current_data`)
        const snapshot = await this.executeWithTimeout(get(connection), 3000)
        const data = snapshot.val()

        if (data) {
          this.cache.set(cacheKey, data)
          results.set(deviceId, data)
        }
      } catch (error) {
        console.error(`❌ Error loading data for ${deviceId}:`, error)
        results.set(deviceId, null)
      }
    })

    await Promise.allSettled(promises)
    console.log(`⚡ Batch loaded ${results.size} devices`)
    return results
  }

  // Smart prefetching
  private async prefetchRelatedData(deviceId: string): Promise<void> {
    if (this.prefetchQueue.has(deviceId)) return

    this.prefetchQueue.add(deviceId)

    // Prefetch recent historical data
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const today = new Date().toISOString().split("T")[0]

    setTimeout(async () => {
      try {
        await this.getHistoricalData(deviceId, yesterday, today, {
          limit: PERFORMANCE_CONFIG.PREFETCH_SIZE,
          priority: "normal",
        })
        console.log(`🔮 Prefetched data for ${deviceId}`)
      } catch (error) {
        console.error(`❌ Prefetch error for ${deviceId}:`, error)
      } finally {
        this.prefetchQueue.delete(deviceId)
      }
    }, 100)
  }

  // Subscribe to updates only (for cached data)
  private subscribeToUpdates(deviceId: string, callback: (data: any) => void, listenerKey: string): void {
    const connection = this.connectionPool.getConnection(`devices/${deviceId}/current_data`)

    const throttledCallback = this.createThrottledCallback((snapshot: any) => {
      const data = snapshot.val()
      if (data) {
        const cacheKey = `current_${deviceId}`
        this.cache.set(cacheKey, data)
        callback(data)
      }
    }, PERFORMANCE_CONFIG.THROTTLE_DELAY * 2) // Slower updates for cached data

    const unsubscribe = onValue(connection, throttledCallback)
    this.connectionPool.addListener(listenerKey, unsubscribe)
  }

  // Throttle helper with different priorities
  private createThrottledCallback<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let lastCall = 0
    let timeout: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
      const now = Date.now()

      if (now - lastCall >= delay) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        lastCall = now
        func(...args)
      } else if (!timeout) {
        timeout = setTimeout(
          () => {
            lastCall = Date.now()
            timeout = null
            func(...args)
          },
          delay - (now - lastCall),
        )
      }
    }
  }

  // Execute with timeout
  private executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout),
      ),
    ])
  }

  // Performance statistics
  getPerformanceStats() {
    return {
      cache: this.cache.getStats(),
      connections: this.connectionPool.getStats(),
      pendingRequests: this.pendingRequests.size,
      prefetchQueue: this.prefetchQueue.size,
    }
  }

  // Cleanup
  cleanup(): void {
    this.connectionPool.cleanup()
    this.cache.clear()
    this.pendingRequests.clear()
    this.prefetchQueue.clear()
  }
}

// Export singleton instance
export const highPerformanceFirebase = new HighPerformanceFirebaseService()

// Performance monitoring
export const performanceMonitor = {
  getStats: () => highPerformanceFirebase.getPerformanceStats(),

  logPerformance: () => {
    const stats = highPerformanceFirebase.getPerformanceStats()
    console.log("🚀 Firebase Performance Stats:", {
      cacheHitRate: `${(stats.cache.hitRate * 100).toFixed(1)}%`,
      cacheSize: stats.cache.size,
      activeConnections: stats.connections.connections,
      activeListeners: stats.connections.activeListeners,
      pendingRequests: stats.pendingRequests,
      prefetchQueue: stats.prefetchQueue,
    })
  },
}

// Auto cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    highPerformanceFirebase.cleanup()
  })

  // Log performance stats every 30 seconds in development
  if (process.env.NODE_ENV === "development") {
    setInterval(() => {
      performanceMonitor.logPerformance()
    }, 30000)
  }
}

console.log("🚀 High-performance Firebase service initialized")
