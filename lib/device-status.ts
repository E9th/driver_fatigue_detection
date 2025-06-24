import { ref as dbRef, onValue, off } from "firebase/database"
import { database } from "@/lib/firebase"

export interface DeviceHeartbeat {
  last_seen: string
  status: "online" | "offline"
  notification_handler?: "active" | "inactive"
}

export interface DeviceStatus {
  deviceId: string
  isOnline: boolean
  lastSeen: Date | null
  notificationHandlerActive: boolean
  timeSinceLastSeen: number // in minutes
}

// ตรวจสอบสถานะ device
export function checkDeviceStatus(deviceId: string, callback: (status: DeviceStatus) => void): () => void {
  const heartbeatRef = dbRef(database, `devices/${deviceId}/heartbeat`)

  const unsubscribe = onValue(heartbeatRef, (snapshot) => {
    const heartbeat: DeviceHeartbeat | null = snapshot.val()

    if (!heartbeat) {
      callback({
        deviceId,
        isOnline: false,
        lastSeen: null,
        notificationHandlerActive: false,
        timeSinceLastSeen: Number.POSITIVE_INFINITY,
      })
      return
    }

    const lastSeen = new Date(heartbeat.last_seen)
    const now = new Date()
    const timeSinceLastSeen = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60)) // minutes

    // ถือว่า online ถ้า heartbeat ไม่เกิน 2 นาที
    const isOnline = timeSinceLastSeen <= 2

    callback({
      deviceId,
      isOnline,
      lastSeen,
      notificationHandlerActive: heartbeat.notification_handler === "active",
      timeSinceLastSeen,
    })
  })

  return () => off(heartbeatRef, "value", unsubscribe)
}

// ตรวจสอบว่า device พร้อมรับข้อความหรือไม่
export async function isDeviceReadyForNotification(deviceId: string): Promise<{
  ready: boolean
  reason?: string
}> {
  return new Promise((resolve) => {
    const unsubscribe = checkDeviceStatus(deviceId, (status) => {
      unsubscribe()

      if (!status.isOnline) {
        resolve({
          ready: false,
          reason: `อุปกรณ์ออฟไลน์ (ไม่ได้ใช้งานมา ${status.timeSinceLastSeen} นาที)`,
        })
        return
      }

      if (!status.notificationHandlerActive) {
        resolve({
          ready: false,
          reason: "ระบบรับข้อความไม่ทำงาน",
        })
        return
      }

      resolve({ ready: true })
    })

    // Timeout หลัง 5 วินาที
    setTimeout(() => {
      unsubscribe()
      resolve({
        ready: false,
        reason: "ไม่สามารถตรวจสอบสถานะอุปกรณ์ได้",
      })
    }, 5000)
  })
}
