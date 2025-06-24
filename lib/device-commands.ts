import { ref as dbRef, push, serverTimestamp, onValue, off } from "firebase/database"
import { database } from "@/lib/firebase"

export interface CallCommand {
  id: string
  deviceId: string
  targetPhone?: string
  message?: string
  timestamp: any
  status: "pending" | "calling" | "completed" | "failed"
  adminId: string
}

export interface CallStatus {
  commandId: string
  status: "received" | "calling" | "completed" | "failed"
  timestamp: any
  error?: string
}

// ส่งคำสั่งโทรไปยัง device
export async function sendCallCommand(
  deviceId: string,
  adminId: string,
  targetPhone?: string,
  message?: string,
): Promise<string> {
  try {
    const commandsRef = dbRef(database, `devices/${deviceId}/commands/calls`)

    const command: Omit<CallCommand, "id"> = {
      deviceId,
      targetPhone,
      message: message || "การแจ้งเตือนจากระบบตรวจจับความง่วงนอน",
      timestamp: serverTimestamp(),
      status: "pending",
      adminId,
    }

    const result = await push(commandsRef, command)
    console.log(`📞 Call command sent to device ${deviceId}:`, result.key)

    return result.key!
  } catch (error) {
    console.error("❌ Error sending call command:", error)
    throw error
  }
}

// ฟัง status ของคำสั่งโทร
export function listenToCallStatus(
  deviceId: string,
  commandId: string,
  callback: (status: CallStatus | null) => void,
): () => void {
  const statusRef = dbRef(database, `devices/${deviceId}/commands/calls/${commandId}/status`)

  const unsubscribe = onValue(statusRef, (snapshot) => {
    const status = snapshot.val()
    callback(status)
  })

  return () => off(statusRef, "value", unsubscribe)
}

// ส่งคำสั่งฉุกเฉิน
export async function sendEmergencyCall(
  deviceId: string,
  adminId: string,
  emergencyContacts: string[],
): Promise<string[]> {
  const commandIds: string[] = []

  for (const phone of emergencyContacts) {
    try {
      const commandId = await sendCallCommand(deviceId, adminId, phone, "🚨 การแจ้งเตือนฉุกเฉิน: ตรวจพบความง่วงนอนระดับวิกฤต")
      commandIds.push(commandId)
    } catch (error) {
      console.error(`❌ Failed to send emergency call to ${phone}:`, error)
    }
  }

  return commandIds
}

// ดึงประวัติคำสั่งโทร
export function getCallHistory(deviceId: string, callback: (calls: CallCommand[]) => void): () => void {
  const historyRef = dbRef(database, `devices/${deviceId}/commands/calls`)

  const unsubscribe = onValue(historyRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const calls = Object.entries(data).map(([id, call]: [string, any]) => ({
        id,
        ...call,
      }))
      callback(calls.sort((a, b) => b.timestamp - a.timestamp))
    } else {
      callback([])
    }
  })

  return () => off(historyRef, "value", unsubscribe)
}
