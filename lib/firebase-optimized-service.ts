import { ref, query, limitToLast, onValue, off, get, type DataSnapshot } from "firebase/database"
import { database, type DeviceData, type HistoricalData } from "./firebase"

// Firebase Usage Monitor
interface UsageStats {
  listeners: number
  reads: number
  writes: number
  cacheSize: number
  lastUpdated: Date
}

// Initialize usage stats
const usageStats: UsageStats = {
  listeners: 0,
  reads: 0,
  writes: 0,
  cacheSize: 0,
  lastUpdated: new Date(),
}

// Cache system
interface CacheItem<T> {
  data: T
  timestamp: number
  key: string
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_LISTENERS = 10
const DEFAULT_THROTTLE = 3000 // 3 seconds

// In-memory cache
const cache: Map<string, CacheItem<any>> = new Map()

// Active listeners tracking
const activeListeners: Map<string, () => void> = new Map()

// Options for subscriptions
interface SubscriptionOptions {
  throttle?: number
  useCache?: boolean
  limit?: number
  pageSize?: number
}

// Throttle function
function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeout: NodeJS.Timeout | null = null
  let lastArgs: Parameters<T> | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()
    lastArgs = args

    if (now - lastCall >= wait) {
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
          if (lastArgs) func(...lastArgs)
        },
        wait - (now - lastCall),
      )
    }
  }
}

// Check and manage listeners limit
function checkListenersLimit(path: string, cleanup: () => void): boolean {
  // If we're at the limit, remove the oldest listener
  if (activeListeners.size >= MAX_LISTENERS) {
    const oldestKey = Array.from(activeListeners.keys())[0]
    console.warn(`🔥 Firebase: Reached maximum listeners (${MAX_LISTENERS}). Removing oldest listener: ${oldestKey}`)
    const oldCleanup = activeListeners.get(oldestKey)
    if (oldCleanup) oldCleanup()
    activeListeners.delete(oldestKey)
  }

  // Register new listener
  activeListeners.set(path, cleanup)
  usageStats.listeners = activeListeners.size
  return true
}

// Cache management
function getCachedData<T>(key: string): T | null {
  const item = cache.get(key)

  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    console.log(`🔥 Firebase: Using cached data for ${key}`)
    return item.data as T
  }

  return null
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    key,
  })

  // Update cache size stats
  usageStats.cacheSize = Array.from(cache.values()).reduce((size, item) => size + JSON.stringify(item.data).length, 0)

  // Clean expired cache items every 100 writes
  if (usageStats.writes % 100 === 0) {
    cleanExpiredCache()
  }
}

function cleanExpiredCache(): void {
  const now = Date.now()
  let removed = 0

  cache.forEach((item, key) => {
    if (now - item.timestamp > CACHE_TTL) {
      cache.delete(key)
      removed++
    }
  })

  if (removed > 0) {
    console.log(`🔥 Firebase: Cleaned ${removed} expired cache items`)
    usageStats.cacheSize = Array.from(cache.values()).reduce((size, item) => size + JSON.stringify(item.data).length, 0)
  }
}

// Optimized Firebase Service
export const optimizedFirebaseService = {
  // Subscribe to current device data with throttling and caching
  subscribeToCurrentData: (
    deviceId: string,
    callback: (data: DeviceData | null) => void,
    options: SubscriptionOptions = {},
  ) => {
    const { throttle: throttleTime = DEFAULT_THROTTLE, useCache = true } = options
    const path = `devices/${deviceId}/current_data`
    const cacheKey = `current_${deviceId}`

    // Check if we have cached data
    if (useCache) {
      const cachedData = getCachedData<DeviceData>(cacheKey)
      if (cachedData) {
        callback(cachedData)
      }
    }

    // Create throttled callback
    const throttledCallback = throttle((snapshot: DataSnapshot) => {
      usageStats.reads++
      usageStats.lastUpdated = new Date()

      const data = snapshot.val() as DeviceData | null
      if (data) {
        if (useCache) {
          setCachedData(cacheKey, data)
        }
        callback(data)
      } else {
        callback(null)
      }
    }, throttleTime)

    // Create reference and subscribe
    const deviceRef = ref(database, path)
    onValue(deviceRef, throttledCallback)

    // Register listener
    checkListenersLimit(path, () => {
      off(deviceRef)
    })

    // Return cleanup function
    return () => {
      off(deviceRef)
      activeListeners.delete(path)
      usageStats.listeners = activeListeners.size
    }
  },

  // Subscribe to historical data with pagination and limits
  subscribeToHistoricalData: (
    deviceId: string,
    startDate: string,
    endDate: string,
    callback: (data: HistoricalData[]) => void,
    options: SubscriptionOptions = {},
  ) => {
    const { limit = 50, useCache = true, pageSize = 20 } = options
    const path = `devices/${deviceId}/history`
    const cacheKey = `history_${deviceId}_${startDate}_${endDate}_${limit}`

    // Check if we have cached data
    if (useCache) {
      const cachedData = getCachedData<HistoricalData[]>(cacheKey)
      if (cachedData) {
        callback(cachedData)
        return () => {} // Return empty cleanup if using cache only
      }
    }

    // Create reference with limit
    const historyRef = query(ref(database, path), limitToLast(limit))

    // One-time fetch for historical data (no need for real-time updates)
    get(historyRef)
      .then((snapshot) => {
        usageStats.reads++
        usageStats.lastUpdated = new Date()

        const data: HistoricalData[] = []
        snapshot.forEach((childSnapshot) => {
          const childData = childSnapshot.val()
          if (childData) {
            // Filter by date range
            const timestamp = childData.timestamp
            if (timestamp >= startDate && timestamp <= endDate) {
              data.push({
                ...childData,
                id: childSnapshot.key || `history_${data.length}`,
              })
            }
          }
          return false // Don't cancel enumeration
        })

        // Sort by timestamp (newest first)
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        // Cache the result
        if (useCache) {
          setCachedData(cacheKey, data)
        }

        // Return the data
        callback(data)
      })
      .catch((error) => {
        console.error("Error fetching historical data:", error)
        callback([])
      })

    // Return cleanup function (no active listener for historical data)
    return () => {}
  },

  // Get device count with caching
  getDeviceCount: async (): Promise<number> => {
    const cacheKey = "device_count"
    const cachedCount = getCachedData<number>(cacheKey)

    if (cachedCount !== null) {
      return cachedCount
    }

    try {
      const snapshot = await get(ref(database, "devices"))
      usageStats.reads++

      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
      setCachedData(cacheKey, count)
      return count
    } catch (error) {
      console.error("Error getting device count:", error)
      return 0
    }
  },

  // Get active device count with caching
  getActiveDeviceCount: async (): Promise<number> => {
    const cacheKey = "active_device_count"
    const cachedCount = getCachedData<number>(cacheKey)

    if (cachedCount !== null) {
      return cachedCount
    }

    try {
      const snapshot = await get(ref(database, "devices"))
      usageStats.reads++

      if (!snapshot.exists()) {
        setCachedData(cacheKey, 0)
        return 0
      }

      const devices = snapshot.val()
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      let activeCount = 0
      Object.values(devices).forEach((device: any) => {
        if (device.current_data && device.current_data.timestamp > oneDayAgo) {
          activeCount++
        }
      })

      setCachedData(cacheKey, activeCount)
      return activeCount
    } catch (error) {
      console.error("Error getting active device count:", error)
      return 0
    }
  },

  // Clear cache
  clearCache: () => {
    cache.clear()
    usageStats.cacheSize = 0
    console.log("🔥 Firebase: Cache cleared")
  },

  // Get usage statistics
  getUsageStats: (): UsageStats => {
    return { ...usageStats }
  },
}

// Export the usage monitor for components to use
export const firebaseUsageMonitor = {
  getStats: () => ({ ...usageStats }),
  resetStats: () => {
    usageStats.reads = 0
    usageStats.writes = 0
    usageStats.lastUpdated = new Date()
    return { ...usageStats }
  },
}
