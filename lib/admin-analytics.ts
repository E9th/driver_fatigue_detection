/**
 * Admin Analytics Service - FIXED data consistency and active device detection
 */

import { database } from "./firebase"
import { ref, get } from "firebase/database"
import type { SystemStats, UserProfile } from "./types"

/**
 * Get all users from Firebase
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    if (!database) {
      console.warn("🔧 Firebase database not initialized for getAllUsers")
      return []
    }

    console.log("🔥 Firebase: Getting all users")
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (snapshot.exists()) {
      const usersData = snapshot.val()
      const users = Object.entries(usersData).map(([id, data]: [string, any]) => ({
        id,
        name: data.name || data.fullName || "",
        email: data.email || "",
        role: data.role || "user",
        deviceId: data.deviceId || data.device_id || "",
        created: data.created || data.registeredAt || "",
        lastLogin: data.lastLogin || "",
        company: data.company || "",
        position: data.position || "",
      }))
      console.log(`✅ Users loaded: ${users.length}`)
      return users
    } else {
      console.log("❌ No users found")
      return []
    }
  } catch (error) {
    console.error("❌ Error getting users:", error)
    return []
  }
}

/**
 * Check if timestamp is within date range
 */
const isWithinDateRange = (timestamp: string, startDate: string, endDate: string): boolean => {
  const itemTime = new Date(timestamp).getTime()
  const startTime = new Date(startDate).getTime()
  const endTime = new Date(endDate).getTime()

  return itemTime >= startTime && itemTime <= endTime
}

/**
 * Check if device is currently active (has data in last 5 minutes)
 */
const checkDeviceActivity = async (deviceId: string): Promise<boolean> => {
  try {
    const currentDataRef = ref(database, `devices/${deviceId}/current_data`)
    const snapshot = await get(currentDataRef)

    if (snapshot.exists()) {
      const data = snapshot.val()
      const now = Date.now()
      const dataTime = new Date(data.timestamp).getTime()
      const fiveMinutesAgo = now - 5 * 60 * 1000

      const isActive = dataTime > fiveMinutesAgo
      console.log(`📱 Device ${deviceId}: ${isActive ? "ACTIVE" : "INACTIVE"} (last seen: ${data.timestamp})`)
      return isActive
    } else {
      console.log(`📱 Device ${deviceId}: NO DATA`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error checking device ${deviceId} activity:`, error)
    return false
  }
}

/**
 * Get system statistics - FIXED data consistency
 */
export const getSystemStats = async (startDate?: string, endDate?: string): Promise<SystemStats> => {
  console.log("📊 Loading system stats with FIXED data consistency...", { startDate, endDate })

  try {
    if (!database) {
      console.error("❌ Firebase database not initialized")
      return getEmptySystemStats()
    }

    // Get all users
    const users = await getAllUsers()
    const driverCount = users.filter((user) => user.role === "user" || user.role === "driver").length
    const adminCount = users.filter((user) => user.role === "admin").length

    // Get device IDs from users
    const deviceIds = users
      .map((user) => user.deviceId)
      .filter(Boolean)
      .filter((id) => id !== "null" && id !== "undefined" && id.trim() !== "")

    const uniqueDeviceIds = [...new Set(deviceIds)]
    console.log("🔍 Device IDs from users:", uniqueDeviceIds)

    // Check which devices are actually active
    const activeDeviceChecks = await Promise.all(
      uniqueDeviceIds.map(async (deviceId) => ({
        deviceId,
        isActive: await checkDeviceActivity(deviceId),
      })),
    )

    const activeDevices = activeDeviceChecks.filter((device) => device.isActive)
    const activeDeviceIds = activeDevices.map((device) => device.deviceId)
    const activeDeviceCount = activeDevices.length

    console.log(`📊 Active devices: ${activeDeviceCount}/${uniqueDeviceIds.length}`)
    console.log(`📊 Active device IDs:`, activeDeviceIds)

    // Initialize counters
    let totalYawns = 0
    let totalDrowsiness = 0
    let totalAlerts = 0

    // FIXED: Only count data if there are active devices
    if (activeDeviceCount > 0 && startDate && endDate) {
      console.log(`🔍 Filtering data by timestamp: ${startDate} to ${endDate}`)

      try {
        // Get alerts data with proper timestamp filtering
        const alertsRef = ref(database, "alerts")
        const alertsSnapshot = await get(alertsRef)

        if (alertsSnapshot.exists()) {
          const alertsData = alertsSnapshot.val()
          let alertCount = 0

          Object.values(alertsData).forEach((alert: any) => {
            // Only count alerts from active devices within date range
            if (
              alert.timestamp &&
              alert.device_id &&
              activeDeviceIds.includes(alert.device_id) &&
              isWithinDateRange(alert.timestamp, startDate, endDate)
            ) {
              alertCount++

              // Count by alert type
              if (alert.alert_type === "yawn_detected") {
                totalYawns++
              } else if (alert.alert_type === "drowsiness_detected") {
                totalDrowsiness++
              } else if (alert.alert_type === "critical_drowsiness") {
                totalAlerts++
              }
            }
          })

          console.log(`📊 Found ${alertCount} alerts from active devices in date range`)
          console.log(`📊 Breakdown: Yawns=${totalYawns}, Drowsiness=${totalDrowsiness}, Alerts=${totalAlerts}`)
        }
      } catch (error) {
        console.error("❌ Error filtering data by timestamp:", error)
      }
    } else if (activeDeviceCount === 0) {
      console.log("⚠️ No active devices found - returning zero stats")
      totalYawns = 0
      totalDrowsiness = 0
      totalAlerts = 0
    }

    // Calculate hourly activity
    const hourlyActivity = await getHourlyActivityFixed(activeDeviceIds, startDate, endDate)

    const stats: SystemStats = {
      totalDevices: uniqueDeviceIds.length,
      activeDevices: activeDeviceCount,
      totalUsers: driverCount,
      adminUsers: adminCount,
      totalYawns,
      totalDrowsiness,
      totalAlerts,
      systemUptime: 99.5,
      hourlyActivity,
      riskDistribution: {
        safe: Math.max(0, Math.round(totalYawns * 0.1)),
        warning: Math.max(0, Math.round(totalYawns * 0.8)),
        danger: Math.max(0, Math.round(totalDrowsiness * 0.9)),
        critical: totalAlerts,
      },
    }

    console.log("✅ System stats calculated with FIXED data consistency:", stats)
    return stats
  } catch (error) {
    console.error("❌ Error calculating system stats:", error)
    return getEmptySystemStats()
  }
}

/**
 * Get empty system stats as fallback
 */
const getEmptySystemStats = (): SystemStats => ({
  totalDevices: 0,
  activeDevices: 0,
  totalUsers: 0,
  adminUsers: 0,
  totalYawns: 0,
  totalDrowsiness: 0,
  totalAlerts: 0,
  systemUptime: 99.5,
  hourlyActivity: getEmptyHourlyActivity(),
  riskDistribution: { safe: 0, warning: 0, danger: 0, critical: 0 },
})

/**
 * Get empty hourly activity data
 */
const getEmptyHourlyActivity = () =>
  Array(24)
    .fill(0)
    .map((_, i) => ({
      hour: i,
      yawns: 0,
      drowsiness: 0,
      alerts: 0,
      activeDevices: 0,
    }))

/**
 * Get hourly activity data - FIXED consistency
 */
export const getHourlyActivityFixed = async (
  activeDeviceIds: string[],
  startDate?: string,
  endDate?: string,
): Promise<{ hour: number; yawns: number; drowsiness: number; alerts: number; activeDevices: number }[]> => {
  try {
    if (!database) {
      console.error("❌ Firebase database not initialized for hourly activity")
      return getEmptyHourlyActivity()
    }

    if (!activeDeviceIds.length) {
      console.log("📊 No active devices for hourly activity")
      return getEmptyHourlyActivity()
    }

    // Initialize hourly data
    const hourlyData = getEmptyHourlyActivity()

    if (!startDate || !endDate) {
      console.log("📊 No date range for hourly activity")
      return hourlyData
    }

    console.log(`🔍 Processing hourly activity for active devices: ${activeDeviceIds.join(", ")}`)

    // Get alerts data and filter by timestamp and active devices
    const alertsRef = ref(database, "alerts")
    const alertsSnapshot = await get(alertsRef)

    if (alertsSnapshot.exists()) {
      const alertsData = alertsSnapshot.val()
      const deviceHours = new Set<string>()

      Object.values(alertsData).forEach((alert: any) => {
        if (
          alert.timestamp &&
          alert.device_id &&
          activeDeviceIds.includes(alert.device_id) &&
          isWithinDateRange(alert.timestamp, startDate, endDate)
        ) {
          const date = new Date(alert.timestamp)
          const hour = date.getHours()
          const deviceHourKey = `${alert.device_id}-${hour}`

          // Count events by type
          if (alert.alert_type === "yawn_detected") {
            hourlyData[hour].yawns++
          } else if (alert.alert_type === "drowsiness_detected") {
            hourlyData[hour].drowsiness++
          } else if (alert.alert_type === "critical_drowsiness") {
            hourlyData[hour].alerts++
          }

          // Count unique active devices per hour
          if (!deviceHours.has(deviceHourKey)) {
            deviceHours.add(deviceHourKey)
            hourlyData[hour].activeDevices++
          }
        }
      })
    }

    console.log("✅ Hourly activity calculated with active device filtering")
    return hourlyData
  } catch (error) {
    console.error("❌ Error calculating hourly activity:", error)
    return getEmptyHourlyActivity()
  }
}

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    if (!database) {
      console.warn("🔧 Firebase database not initialized for getUserProfile")
      return null
    }

    console.log(`🔍 Loading profile for user ID: ${userId}`)
    const userRef = ref(database, `users/${userId}`)
    const snapshot = await get(userRef)

    if (snapshot.exists()) {
      const userData = snapshot.val()
      const profile: UserProfile = {
        id: userId,
        name: userData.name || userData.fullName || "",
        email: userData.email || "",
        role: userData.role || "user",
        deviceId: userData.deviceId || userData.device_id || "",
        created: userData.created || userData.registeredAt || "",
        lastLogin: userData.lastLogin || "",
        company: userData.company || "",
        position: userData.position || "",
      }
      console.log(`✅ User profile loaded: ${profile.name}`)
      return profile
    } else {
      console.log(`❌ No profile found for user ID: ${userId}`)
      return null
    }
  } catch (error) {
    console.error(`❌ Error loading profile for user ID: ${userId}:`, error)
    return null
  }
}

console.log("📊 Admin analytics service initialized with FIXED data consistency")
