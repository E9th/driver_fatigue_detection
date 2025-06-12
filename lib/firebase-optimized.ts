import {
  ref,
  onValue,
  query,
  limitToLast,
  orderByChild,
  startAt,
  endAt,
  type DatabaseReference,
} from "firebase/database"
import { database } from "./firebase-singleton"

// Cache และ Connection Management
class FirebaseConnectionManager {
  private activeListeners = new Map<string, () => void>()
  private dataCache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private connectionPool = new Map<string, DatabaseReference>()

  // สร้าง unique key สำหรับ listener
  private getListenerKey(path: string, params?: any): string {
    return `${path}_${JSON.stringify(params || {})}`
  }

  // ตรวจสอบ cache ก่อนสร้าง listener ใหม่
  private getCachedData(key: string) {
    const cached = this.dataCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  // สร้าง optimized listener
  subscribeToCurrentData(
    deviceId: string,
    callback: (data: any) => void,
    options: { useCache?: boolean; throttle?: number } = {},
  ) {
    const { useCache = true, throttle = 1000 } = options
    const listenerKey = this.getListenerKey(`devices/${deviceId}/current_data`)

    // ตรวจสอบ cache ก่อน
    if (useCache) {
      const cachedData = this.getCachedData(listenerKey)
      if (cachedData) {
        setTimeout(() => callback(cachedData), 0)
        return () => {} // Return empty cleanup function
      }
    }

    // ยกเลิก listener เก่าถ้ามี
    this.cleanup(listenerKey)

    // สร้าง reference แบบ specific path
    const dataRef = ref(database, `devices/${deviceId}/current_data`)

    // Throttle callback เพื่อลดการ update บ่อย
    let lastCallTime = 0
    const throttledCallback = (data: any) => {
      const now = Date.now()
      if (now - lastCallTime >= throttle) {
        lastCallTime = now
        // Cache ข้อมูล
        this.dataCache.set(listenerKey, { data, timestamp: now })
        callback(data)
      }
    }

    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          throttledCallback(snapshot.val())
        } else {
          throttledCallback(null)
        }
      },
      (error) => {
        console.error(`Firebase error for ${listenerKey}:`, error)
        callback(null)
      },
    )

    // เก็บ listener สำหรับ cleanup
    this.activeListeners.set(listenerKey, unsubscribe)

    return () => this.cleanup(listenerKey)
  }

  // Historical data แบบ optimized
  subscribeToHistoricalData(
    deviceId: string,
    startDate: string,
    endDate: string,
    callback: (data: any[]) => void,
    options: { limit?: number; useCache?: boolean } = {},
  ) {
    const { limit = 100, useCache = true } = options
    const listenerKey = this.getListenerKey(`devices/${deviceId}/historical_data`, { startDate, endDate, limit })

    // ตรวจสอบ cache
    if (useCache) {
      const cachedData = this.getCachedData(listenerKey)
      if (cachedData) {
        setTimeout(() => callback(cachedData), 0)
        return () => {}
      }
    }

    // ยกเลิก listener เก่า
    this.cleanup(listenerKey)

    // สร้าง query แบบจำกัด
    const historicalRef = ref(database, `devices/${deviceId}/historical_data`)
    const limitedQuery = query(
      historicalRef,
      orderByChild("timestamp"),
      startAt(startDate),
      endAt(endDate),
      limitToLast(limit), // จำกัดจำนวนข้อมูล
    )

    const unsubscribe = onValue(
      limitedQuery,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = Object.entries(snapshot.val()).map(([key, value]) => ({
            id: key,
            ...(value as any),
          }))

          // Cache ข้อมูล
          this.dataCache.set(listenerKey, { data, timestamp: Date.now() })
          callback(data)
        } else {
          callback([])
        }
      },
      (error) => {
        console.error(`Firebase error for ${listenerKey}:`, error)
        callback([])
      },
    )

    this.activeListeners.set(listenerKey, unsubscribe)
    return () => this.cleanup(listenerKey)
  }

  // Device list แบบ optimized
  subscribeToDeviceList(callback: (devices: string[]) => void) {
    const listenerKey = "device_list"

    // ตรวจสอบ cache
    const cachedData = this.getCachedData(listenerKey)
    if (cachedData) {
      setTimeout(() => callback(cachedData), 0)
      return () => {}
    }

    this.cleanup(listenerKey)

    // ใช้ shallow query เพื่อดึงเฉพาะ keys
    const devicesRef = ref(database, "devices")
    const shallowQuery = query(devicesRef, limitToLast(50)) // จำกัดจำนวนอุปกรณ์

    const unsubscribe = onValue(shallowQuery, (snapshot) => {
      if (snapshot.exists()) {
        const deviceIds = Object.keys(snapshot.val())
        this.dataCache.set(listenerKey, { data: deviceIds, timestamp: Date.now() })
        callback(deviceIds)
      } else {
        callback([])
      }
    })

    this.activeListeners.set(listenerKey, unsubscribe)
    return () => this.cleanup(listenerKey)
  }

  // Cleanup specific listener
  cleanup(listenerKey: string) {
    const unsubscribe = this.activeListeners.get(listenerKey)
    if (unsubscribe) {
      unsubscribe()
      this.activeListeners.delete(listenerKey)
    }
  }

  // Cleanup ทั้งหมด
  cleanupAll() {
    console.log(`🧹 Cleaning up ${this.activeListeners.size} Firebase listeners`)
    this.activeListeners.forEach((unsubscribe) => {
      unsubscribe()
    })
    this.activeListeners.clear()
    this.dataCache.clear()
  }

  // ดูสถานะ listeners
  getActiveListenersCount(): number {
    return this.activeListeners.size
  }

  // Clear cache
  clearCache() {
    this.dataCache.clear()
  }
}

// Singleton instance
export const firebaseManager = new FirebaseConnectionManager()

// Hook สำหรับ React components
export const useFirebaseCleanup = () => {
  const cleanup = () => {
    firebaseManager.cleanupAll()
  }

  return cleanup
}

// Optimized data service
export const optimizedDataService = {
  // Current data แบบ optimized
  subscribeToCurrentData: (deviceId: string, callback: (data: any) => void) => {
    return firebaseManager.subscribeToCurrentData(deviceId, callback, {
      useCache: true,
      throttle: 2000, // Update ทุก 2 วินาที
    })
  },

  // Historical data แบบ optimized
  subscribeToHistoricalData: (
    deviceId: string,
    startDate: string,
    endDate: string,
    callback: (data: any[]) => void,
  ) => {
    return firebaseManager.subscribeToHistoricalData(deviceId, startDate, endDate, callback, {
      limit: 50, // จำกัด 50 records
      useCache: true,
    })
  },

  // Device list แบบ optimized
  subscribeToDeviceList: (callback: (devices: string[]) => void) => {
    return firebaseManager.subscribeToDeviceList(callback)
  },

  // Batch operations
  batchSubscribe: (subscriptions: Array<() => () => void>) => {
    const unsubscribers = subscriptions.map((sub) => sub())
    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  },
}
