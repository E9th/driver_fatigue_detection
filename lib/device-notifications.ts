import { ref as dbRef, push, serverTimestamp, onValue, off } from "firebase/database"
import { database } from "@/lib/firebase"

export interface NotificationCommand {
  id: string
  deviceId: string
  type: "alert" | "emergency" | "warning"
  message: string
  channels: ("sound" | "sound_with_tts" | "display")[]
  timestamp: any
  status: "pending" | "processing" | "completed" | "failed"
  adminId: string
  priority: "low" | "medium" | "high" | "critical"
  ttsEnabled?: boolean
}

export interface NotificationStatus {
  commandId: string
  status: "received" | "processing" | "completed" | "failed"
  timestamp: any
  error?: string
  results?: {
    sound?: boolean
    display?: boolean
    tts?: boolean
  }
}

// ส่งการแจ้งเตือนไปยัง device
export async function sendNotificationCommand(
  deviceId: string,
  adminId: string,
  type: "alert" | "emergency" | "warning",
  message: string,
  channels: ("sound" | "sound_with_tts" | "display")[] = ["sound", "display"],
): Promise<string> {
  try {
    const commandsRef = dbRef(database, `devices/${deviceId}/commands/notifications`)

    const priority = type === "emergency" ? "critical" : type === "warning" ? "high" : "medium"
    const ttsEnabled = channels.includes("sound_with_tts")

    const command: Omit<NotificationCommand, "id"> = {
      deviceId,
      type,
      message,
      channels,
      timestamp: serverTimestamp(),
      status: "pending",
      adminId,
      priority,
      ttsEnabled,
    }

    const result = await push(commandsRef, command)
    console.log(`🔔 Notification command sent to device ${deviceId}:`, result.key)
    console.log(`📝 Message: "${message}"`)
    console.log(`🔊 TTS enabled: ${ttsEnabled}`)

    return result.key!
  } catch (error) {
    console.error("❌ Error sending notification command:", error)
    throw error
  }
}

// ส่งการแจ้งเตือนฉุกเฉิน (พร้อม TTS)
export async function sendEmergencyNotification(
  deviceId: string,
  adminId: string,
  message = "🚨 การแจ้งเตือนฉุกเฉิน: ตรวจพบความง่วงนอนระดับวิกฤต กรุณาหยุดรถในที่ปลอดภัย",
): Promise<string> {
  return await sendNotificationCommand(
    deviceId,
    adminId,
    "emergency",
    message,
    ["sound_with_tts", "display"], // บังคับใช้ TTS สำหรับฉุกเฉิน
  )
}

// ฟัง status ของการแจ้งเตือน
export function listenToNotificationStatus(
  deviceId: string,
  commandId: string,
  callback: (status: NotificationStatus | null) => void,
): () => void {
  const statusRef = dbRef(database, `devices/${deviceId}/commands/notifications/${commandId}/status`)

  const unsubscribe = onValue(statusRef, (snapshot) => {
    const status = snapshot.val()
    callback(status)
  })

  return () => off(statusRef, "value", unsubscribe)
}

// ดึงประวัติการแจ้งเตือน
export function getNotificationHistory(
  deviceId: string,
  callback: (notifications: NotificationCommand[]) => void,
): () => void {
  const historyRef = dbRef(database, `devices/${deviceId}/commands/notifications`)

  const unsubscribe = onValue(historyRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const notifications = Object.entries(data).map(([id, notification]: [string, any]) => ({
        id,
        ...notification,
      }))
      callback(notifications.sort((a, b) => b.timestamp - a.timestamp))
    } else {
      callback([])
    }
  })

  return () => off(historyRef, "value", unsubscribe)
}
