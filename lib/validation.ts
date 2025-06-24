/**
 * ============================================================================
 * VALIDATION LIBRARY - ระบบตรวจสอบความถูกต้องของข้อมูล
 * ============================================================================
 *
 * ไฟล์นี้จัดการการตรวจสอบข้อมูลต่างๆ ก่อนบันทึกลง Firebase
 * รวมถึงการตรวจสอบอีเมลซ้ำ, อุปกรณ์ซ้ำ, และดึงรายการอุปกรณ์ที่ใช้แล้ว
 *
 * DEPENDENCIES:
 * - lib/firebase.ts: สำหรับเชื่อมต่อ Firebase Realtime Database
 *
 * USED BY:
 * - app/register/page.tsx: ตรวจสอบข้อมูลก่อนลงทะเบียน
 * - components/device-id-selector.tsx: ดึงรายการอุปกรณ์ที่ใช้แล้ว
 */

import { database } from "./firebase"
import { ref, get, query, orderByChild, equalTo } from "firebase/database"

/**
 * ตรวจสอบว่าอีเมลนี้ถูกใช้งานแล้วหรือไม่
 *
 * @param email - อีเมลที่ต้องการตรวจสอบ
 * @returns Promise<boolean> - true ถ้าอีเมลถูกใช้แล้ว, false ถ้าใช้ได้
 *
 * FIREBASE PATH: /users/{uid}/email
 * QUERY: orderByChild('email').equalTo(email)
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    console.log("🔍 Validation: Checking email existence:", email)

    // สร้าง query เพื่อค้นหาอีเมลใน users collection
    const usersRef = ref(database, "users")
    const emailQuery = query(usersRef, orderByChild("email"), equalTo(email))

    // ดึงข้อมูลจาก Firebase
    const snapshot = await get(emailQuery)

    // ตรวจสอบว่ามีข้อมูลหรือไม่
    const exists = snapshot.exists()
    console.log("🔍 Validation: Email exists:", exists)

    return exists
  } catch (error) {
    console.error("🔥 Validation: Error checking email:", error)
    throw new Error("Permission denied")
  }
}

/**
 * ตรวจสอบว่าอุปกรณ์นี้ถูกใช้งานแล้วหรือไม่
 *
 * @param deviceId - ID ของอุปกรณ์ที่ต้องการตรวจสอบ (เช่น device_01)
 * @returns Promise<boolean> - true ถ้าอุปกรณ์ถูกใช้แล้ว, false ถ้าใช้ได้
 *
 * FIREBASE PATH: /users/{uid}/deviceId
 * QUERY: orderByChild('deviceId').equalTo(deviceId)
 */
export async function checkDeviceExists(deviceId: string): Promise<boolean> {
  try {
    console.log("🔍 Validation: Checking device existence:", deviceId)

    // สร้าง query เพื่อค้นหาอุปกรณ์ใน users collection
    const usersRef = ref(database, "users")
    const deviceQuery = query(usersRef, orderByChild("deviceId"), equalTo(deviceId))

    // ดึงข้อมูลจาก Firebase
    const snapshot = await get(deviceQuery)

    // ตรวจสอบว่ามีข้อมูลหรือไม่
    const exists = snapshot.exists()
    console.log("🔍 Validation: Device exists:", exists)

    return exists
  } catch (error) {
    console.error("🔥 Validation: Error checking device:", error)
    throw new Error("Permission denied")
  }
}

/**
 * ตรวจสอบว่าเลขใบขับขี่นี้ถูกใช้งานแล้วหรือไม่
 *
 * @param license - เลขใบขับขี่ที่ต้องการตรวจสอบ
 * @returns Promise<boolean> - true ถ้าถูกใช้แล้ว, false ถ้าใช้ได้
 *
 * FIREBASE PATH: /users/{uid}/license
 * QUERY: orderByChild('license').equalTo(license)
 */
export async function checkLicenseExists(license: string): Promise<boolean> {
  try {
    console.log("🔍 Validation: Checking license existence:", license);

    // สร้าง query เพื่อค้นหาเลขใบขับขี่ใน users collection
    const usersRef = ref(database, "users");
    const licenseQuery = query(usersRef, orderByChild("license"), equalTo(license));

    // ดึงข้อมูลจาก Firebase
    const snapshot = await get(licenseQuery);

    const exists = snapshot.exists();
    console.log("🔍 Validation: License exists:", exists);

    return exists;
  } catch (error) {
    console.error("🔥 Validation: Error checking license:", error);
    // ในกรณีที่เกิดข้อผิดพลาด ให้โยน Error เพื่อให้ client จัดการต่อ
    throw new Error("Permission denied or index not defined");
  }
}

/**
 * ดึงรายการอุปกรณ์ที่ถูกใช้งานแล้วทั้งหมด
 *
 * @returns Promise<string[]> - อาร์เรย์ของ device ID ที่ถูกใช้แล้ว
 *
 * FIREBASE PATH: /users/{uid}/deviceId
 *
 * ใช้สำหรับ:
 * - แสดงรายการอุปกรณ์ที่ว่างใน dropdown
 * - ตรวจสอบความพร้อมใช้งานของอุปกรณ์
 */
export async function getUsedDevices(): Promise<string[]> {
  try {
    console.log("🔍 Validation: Getting used devices list")

    // ดึงข้อมูล users ทั้งหมด
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    const usedDevices: string[] = []

    if (snapshot.exists()) {
      // วนลูปผ่าน users ทั้งหมดเพื่อเก็บ deviceId
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val()
        if (userData.deviceId && userData.deviceId !== "null") {
          usedDevices.push(userData.deviceId)
        }
      })
    }

    // กรองค่าที่ซ้ำออก
    const uniqueDevices = [...new Set(usedDevices)]
    console.log("🔍 Validation: Used devices:", uniqueDevices)

    return uniqueDevices
  } catch (error) {
    console.error("🔥 Validation: Error getting used devices:", error)
    return [] // ส่งคืนอาร์เรย์ว่างถ้าเกิดข้อผิดพลาด
  }
}
