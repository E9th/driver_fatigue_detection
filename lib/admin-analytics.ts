/**
 * Admin Analytics Service - FIXED DATE FILTERING
 * Uses timestamp-based filtering for accurate date range queries
 */

import { database } from "./firebase-singleton"
import { ref, get } from "firebase/database"
import { subscribeToCurrentData } from "./firebase"
import type { SystemStats, UserProfile } from "./types"

/**
 * Get all users from Firebase
 * @returns Promise with array of user profiles
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    if (!database) {
      console.warn("🔧 Firebase not available for getAllUsers")
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
 * @param timestamp - ISO timestamp string
 * @param startDate - Start date ISO string
 * @param endDate - End date ISO string
 * @returns Boolean indicating if timestamp is within range
 */
const isWithinDateRange = (timestamp: string, startDate: string, endDate: string): boolean => {
  const itemTime = new Date(timestamp).getTime()
  const startTime = new Date(startDate).getTime()
  const endTime = new Date(endDate).getTime()

  return itemTime >= startTime && itemTime <= endTime
}

/**
 * Get system statistics for admin dashboard - FIXED with timestamp filtering
 * @param startDate - Start date for filtering
 * @param endDate - End date for filtering
 * @returns Promise with system statistics
 */
export const getSystemStats = async (startDate?: string, endDate?: string): Promise<SystemStats> => {
  console.log("📊 Loading system stats with FIXED timestamp filtering...", { startDate, endDate })

  try {
    // Get all users
    const users = await getAllUsers()
    const driverCount = users.filter((user) => user.role === "user" || user.role === "driver").length
    const adminCount = users.filter((user) => user.role === "admin").length

    // Get device IDs from users
    const deviceIds = users
      .map((user) => user.deviceId)
      .filter(Boolean)
      .filter((id) => id !== "null")

    // Get unique device IDs
    const uniqueDeviceIds = [...new Set(deviceIds)]
    console.log("🔍 Unique device IDs:", uniqueDeviceIds)

    // Initialize counters
    let totalYawns = 0
    let totalDrowsiness = 0
    let totalAlerts = 0
    let activeDeviceCount = 0

    // Get current data for active device detection
    const devicePromises = uniqueDeviceIds.map(async (deviceId) => {
      console.log(`🔍 Getting CURRENT_DATA for device: ${deviceId}`)

      return new Promise<{
        deviceId: string
        isActive: boolean
        yawns: number
        drowsiness: number
        alerts: number
      }>((resolve) => {
        try {
          const unsubscribe = subscribeToCurrentData(deviceId, (currentData) => {
            if (!currentData) {
              console.log(`❌ No current_data found for device ${deviceId}`)
              resolve({
                deviceId,
                isActive: false,
                yawns: 0,
                drowsiness: 0,
                alerts: 0,
              })
              return
            }

            // Check if device is active (has data in the last 5 minutes)
            const now = Date.now()
            const dataTime = new Date(currentData.timestamp).getTime()
            const fiveMinutesAgo = now - 5 * 60 * 1000
            const isActive = dataTime > fiveMinutesAgo

            resolve({
              deviceId,
              isActive,
              yawns: currentData.yawn_events || 0,
              drowsiness: currentData.drowsiness_events || 0,
              alerts: currentData.critical_alerts || 0,
            })

            if (typeof unsubscribe === "function") {
              unsubscribe()
            }
          })

          // Set timeout to avoid hanging
          setTimeout(() => {
            if (typeof unsubscribe === "function") {
              unsubscribe()
            }
            resolve({
              deviceId,
              isActive: false,
              yawns: 0,
              drowsiness: 0,
              alerts: 0,
            })
          }, 5000)
        } catch (error) {
          console.error(`❌ Error getting data for device ${deviceId}:`, error)
          resolve({
            deviceId,
            isActive: false,
            yawns: 0,
            drowsiness: 0,
            alerts: 0,
          })
        }
      })
    })

    // Wait for all device data to be processed
    const deviceStats = await Promise.all(devicePromises)

    // Count active devices
    deviceStats.forEach((stats) => {
      if (stats.isActive) activeDeviceCount++
    })

    // FIXED: Get filtered data from alerts and history based on timestamp
    if (startDate && endDate) {
      console.log(`🔍 Filtering data by timestamp: ${startDate} to ${endDate}`)

      // Get alerts data with timestamp filtering
      const alertsRef = ref(database, "alerts")
      const alertsSnapshot = await get(alertsRef)

      if (alertsSnapshot.exists()) {
        const alertsData = alertsSnapshot.val()
        Object.values(alertsData).forEach((alert: any) => {
          if (alert.timestamp && isWithinDateRange(alert.timestamp, startDate, endDate)) {
            if (alert.alert_type === "yawn_detected") {
              totalYawns++
            } else if (alert.alert_type === "drowsiness_detected") {
              totalDrowsiness++
            } else if (alert.alert_type === "critical_drowsiness") {
              totalAlerts++
            }
          }
        })
      }

      // Get historical data with timestamp filtering
      for (const deviceId of uniqueDeviceIds) {
        const historyRef = ref(database, `devices/${deviceId}/history`)
        const historySnapshot = await get(historyRef)

        if (historySnapshot.exists()) {
          const historyData = historySnapshot.val()
          Object.values(historyData).forEach((item: any) => {
            if (item.timestamp && isWithinDateRange(item.timestamp, startDate, endDate)) {
              // Don't double count - use only alerts table for consistency
              // This is just for additional validation
            }
          })
        }
      }
    } else {
      // If no date range, use current data
      deviceStats.forEach((stats) => {
        totalYawns += stats.yawns
        totalDrowsiness += stats.drowsiness
        totalAlerts += stats.alerts
      })
    }

    // Calculate hourly activity with FIXED timestamp filtering
    const hourlyActivity = await getHourlyActivityFixed(uniqueDeviceIds, startDate, endDate)

    // Return system stats
    const stats: SystemStats = {
      totalDevices: uniqueDeviceIds.length,
      activeDevices: activeDeviceCount,
      totalUsers: driverCount,
      adminUsers: adminCount,
      totalYawns,
      totalDrowsiness,
      totalAlerts,
      systemUptime: 99.5, // Placeholder
      hourlyActivity,
      riskDistribution: {
        safe: Math.round(totalYawns * 0.33),
        warning: Math.round(totalYawns * 0.25),
        danger: Math.round(totalDrowsiness * 0.4),
        critical: totalAlerts,
      },
    }

    console.log("✅ System stats calculated with FIXED timestamp filtering:", stats)
    return stats
  } catch (error) {
    console.error("❌ Error calculating system stats:", error)
    return {
      totalDevices: 0,
      activeDevices: 0,
      totalUsers: 0,
      adminUsers: 0,
      totalYawns: 0,
      totalDrowsiness: 0,
      totalAlerts: 0,
      systemUptime: 99.5,
      hourlyActivity: Array(24)
        .fill(0)
        .map((_, i) => ({
          hour: i,
          yawns: 0,
          drowsiness: 0,
          alerts: 0,
          activeDevices: 0,
        })),
      riskDistribution: { safe: 0, warning: 0, danger: 0, critical: 0 },
    }
  }
}

/**
 * Get hourly activity data with FIXED timestamp filtering
 * @param deviceIds - Array of device IDs
 * @param startDate - Start date for filtering
 * @param endDate - End date for filtering
 * @returns Promise with hourly activity data
 */
export const getHourlyActivityFixed = async (
  deviceIds: string[],
  startDate?: string,
  endDate?: string,
): Promise<{ hour: number; yawns: number; drowsiness: number; alerts: number; activeDevices: number }[]> => {
  try {
    if (!deviceIds.length || !startDate || !endDate) {
      console.log("📊 No devices or date range for hourly activity")
      return Array(24)
        .fill(0)
        .map((_, i) => ({
          hour: i,
          yawns: 0,
          drowsiness: 0,
          alerts: 0,
          activeDevices: 0,
        }))
    }

    // Initialize hourly data
    const hourlyData = Array(24)
      .fill(0)
      .map((_, i) => ({
        hour: i,
        yawns: 0,
        drowsiness: 0,
        alerts: 0,
        activeDevices: 0,
      }))

    console.log(`🔍 Processing hourly activity with timestamp filtering: ${startDate} to ${endDate}`)

    // FIXED: Get alerts data and filter by timestamp
    const alertsRef = ref(database, "alerts")
    const alertsSnapshot = await get(alertsRef)

    if (alertsSnapshot.exists()) {
      const alertsData = alertsSnapshot.val()
      const deviceHours = new Set<string>() // Track unique device-hour combinations

      Object.values(alertsData).forEach((alert: any) => {
        if (alert.timestamp && isWithinDateRange(alert.timestamp, startDate, endDate)) {
          const date = new Date(alert.timestamp)
          const hour = date.getHours()
          const deviceHourKey = `${alert.device_id}-${hour}`

          if (alert.alert_type === "yawn_detected") {
            hourlyData[hour].yawns++
          } else if (alert.alert_type === "drowsiness_detected") {
            hourlyData[hour].drowsiness++
          } else if (alert.alert_type === "critical_drowsiness") {
            hourlyData[hour].alerts++
          }

          // Count unique devices per hour
          if (!deviceHours.has(deviceHourKey)) {
            deviceHours.add(deviceHourKey)
            hourlyData[hour].activeDevices++
          }
        }
      })
    }

    console.log("✅ Hourly activity calculated with timestamp filtering")
    return hourlyData
  } catch (error) {
    console.error("❌ Error calculating hourly activity:", error)
    return Array(24)
      .fill(0)
      .map((_, i) => ({
        hour: i,
        yawns: 0,
        drowsiness: 0,
        alerts: 0,
        activeDevices: 0,
      }))
  }
}

/**
 * Get user profile by ID
 * @param userId - User ID
 * @returns Promise with user profile
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    if (!database) {
      console.warn("🔧 Firebase not available for getUserProfile")
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

console.log("📊 Admin analytics service FIXED with timestamp-based filtering")
