import { ref, get, set } from "firebase/database"
import { database } from "./firebase"

// ฟังก์ชันสำหรับเปลี่ยน Driver เป็น Admin
export const promoteDriverToAdmin = async (
  uid: string,
): Promise<{ success: boolean; error?: string; releasedDeviceId?: string }> => {
  try {
    console.log(`👑 Promoting user ${uid} to admin...`)

    // 1. ดึงข้อมูลผู้ใช้ปัจจุบัน
    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)

    if (!snapshot.exists()) {
      return { success: false, error: "ไม่พบผู้ใช้" }
    }

    const userData = snapshot.val()
    const deviceId = userData.deviceId

    // 2. อัปเดตเป็น admin และเอา deviceId ออก
    await set(userRef, {
      ...userData,
      role: "admin",
      deviceId: null, // เอา device ออก
      promotedToAdminAt: new Date().toISOString(),
    })

    console.log(`✅ User ${uid} promoted to admin, device ${deviceId} released`)

    return {
      success: true,
      releasedDeviceId: deviceId,
    }
  } catch (error: any) {
    console.error("Error promoting user to admin:", error)
    return { success: false, error: error.message }
  }
}

// ฟังก์ชันสำหรับตรวจสอบ Device ที่ว่าง
export const getAvailableDevices = async (): Promise<string[]> => {
  try {
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (!snapshot.exists()) {
      return []
    }

    const users = snapshot.val()
    const usedDeviceIds = new Set<string>()

    // เก็บ device ที่ใช้งานอยู่
    Object.values(users).forEach((user: any) => {
      if (user.deviceId && user.role === "driver") {
        usedDeviceIds.add(user.deviceId)
      }
    })

    // สร้างรายการ device ทั้งหมด (สมมติว่ามี device_01 ถึง device_20)
    const allDevices = Array.from({ length: 20 }, (_, i) => `device_${String(i + 1).padStart(2, "0")}`)

    // คืนค่า device ที่ว่าง
    const availableDevices = allDevices.filter((device) => !usedDeviceIds.has(device))

    console.log(`📱 Available devices: ${availableDevices.length}`, availableDevices)
    return availableDevices
  } catch (error) {
    console.error("Error getting available devices:", error)
    return []
  }
}
