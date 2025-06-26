"use client"

/**
 * ============================================================================
 * AUTHENTICATION LIBRARY - ระบบจัดการการยืนยันตัวตน
 * ============================================================================
 *
 * ไฟล์นี้จัดการระบบ Authentication ทั้งหมด
 * รวมถึงการลงทะเบียน, ล็อกอิน, ล็อกเอาต์, และการจัดการข้อมูลผู้ใช้
 *
 * DEPENDENCIES:
 * - lib/firebase.ts: Firebase configuration และ instances
 * - firebase/auth: Firebase Authentication methods
 * - firebase/database: Firebase Realtime Database methods
 *
 * USED BY:
 * - app/register/page.tsx: สำหรับลงทะเบียนผู้ใช้ใหม่
 * - app/login/page.tsx: สำหรับล็อกอินผู้ใช้
 * - components/**: สำหรับตรวจสอบสถานะการล็อกอิน
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth"
import { ref, set, get } from "firebase/database"
import { auth, database } from "./firebase"
import { useState, useEffect } from "react"

/**
 * Interface สำหรับข้อมูลการลงทะเบียนผู้ใช้
 *
 * VALIDATION RULES:
 * - fullName: ต้องไม่ว่าง
 * - email: ต้องเป็นรูปแบบอีเมลที่ถูกต้องและไม่ซ้ำ
 * - password: ต้องมีอย่างน้อย 6 ตัวอักษร
 * - phone: ต้องไม่ว่าง
 * - license: ต้องไม่ว่าง
 * - deviceId: ต้องเลือกและไม่ซ้ำกับผู้ใช้อื่น
 */
export interface RegisterData {
  fullName: string
  email: string
  password: string
  phone: string
  license: string
  deviceId: string
}

/**
 * Interface สำหรับข้อมูลการล็อกอิน
 */
export interface LoginData {
  email: string
  password: string
}

/**
 * Interface สำหรับผลลัพธ์การดำเนินการ
 *
 * SUCCESS RESPONSE:
 * - success: true
 * - user: User object จาก Firebase
 * - error: undefined
 *
 * ERROR RESPONSE:
 * - success: false
 * - user: undefined
 * - error: ข้อความแสดงข้อผิดพลาด
 */
export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

// ============================================================================
// useAuthState - Custom React hook for subscribing to Firebase auth updates
// ============================================================================

/**
 * Track Firebase authentication status in React components.
 *
 * STATE RETURNED:
 * - user:           Firebase User object | null
 * - isLoading:      true จนกว่า auth state ถูกกำหนด
 * - error:          string | null – ข้อความ error ถ้ามี
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If Firebase not initialised (e.g. dev without env vars) – skip
    if (!auth) {
      console.warn("🔧 Firebase auth not available, using mock state")
      setIsLoading(false)
      return
    }

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
        setIsLoading(false)
      },
      (err) => {
        console.error("🔥 Auth: onAuthStateChanged error", err)
        setError("เกิดข้อผิดพลาดในการตรวจสอบสถานะผู้ใช้")
        setIsLoading(false)
      },
    )

    // Cleanup on unmount
    return unsubscribe
  }, [])

  return { user, isLoading, error }
}

/**
 * ลงทะเบียนผู้ใช้ใหม่
 *
 * PROCESS FLOW:
 * 1. สร้าง Firebase Authentication Account
 * 2. บันทึกข้อมูลเพิ่มเติมลง Realtime Database
 * 3. ส่งคืนผลลัพธ์
 *
 * @param data - ข้อมูลการลงทะเบียน
 * @returns Promise<AuthResult> - ผลลัพธ์การลงทะเบียน
 *
 * FIREBASE PATHS:
 * - Authentication: สร้าง user account
 * - Database: /users/{uid}/ - บันทึกข้อมูลเพิ่มเติม
 *
 * ERROR HANDLING:
 * - auth/email-already-in-use: อีเมลถูกใช้แล้ว
 * - auth/weak-password: รหัสผ่านไม่แข็งแรงพอ
 * - auth/invalid-email: รูปแบบอีเมลไม่ถูกต้อง
 */
export async function registerUser(data: RegisterData): Promise<AuthResult> {
  try {
    console.log("🔐 Auth: Starting user registration for:", data.email)

    // STEP 1: สร้าง Firebase Authentication Account
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)

    const user = userCredential.user
    console.log("🔐 Auth: Firebase user created with UID:", user.uid)

    // STEP 2: เตรียมข้อมูลเพิ่มเติมสำหรับบันทึกลง Database
    const userData = {
      uid: user.uid,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      license: data.license,
      deviceId: data.deviceId,
      role: "driver", // <<< แก้ไข: เปลี่ยน "user" เป็น "driver"
      registeredAt: new Date().toISOString(), // <<< แก้ไข: เปลี่ยน createdAt และรูปแบบข้อมูล
      lastLogin: Date.now(),
    }

    // STEP 3: บันทึกข้อมูลลง Realtime Database
    const userRef = ref(database, `users/${user.uid}`)
    await set(userRef, userData)

    console.log("🔐 Auth: User data saved to database")
    console.log("🔐 Auth: Registration completed successfully")

    return {
      success: true,
      user: user,
    }
  } catch (error: any) {
    console.error("🔥 Auth: Registration error:", error)

    // แปลงข้อผิดพลาดเป็นภาษาไทย
    let errorMessage = "เกิดข้อผิดพลาดในการสมัครสมาชิก"

    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "อีเมลนี้ถูกใช้งานแล้ว"
        break
      case "auth/weak-password":
        errorMessage = "รหัสผ่านไม่แข็งแรงพอ"
        break
      case "auth/invalid-email":
        errorMessage = "รูปแบบอีเมลไม่ถูกต้อง"
        break
      case "auth/operation-not-allowed":
        errorMessage = "การดำเนินการนี้ไม่ได้รับอนุญาต"
        break
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * ล็อกอินผู้ใช้
 *
 * PROCESS FLOW:
 * 1. ตรวจสอบ email และ password กับ Firebase Auth
 * 2. อัปเดต lastLogin timestamp
 * 3. ส่งคืนผลลัพธ์
 *
 * @param data - ข้อมูลการล็อกอิน
 * @returns Promise<AuthResult> - ผลลัพธ์การล็อกอิน
 *
 * ERROR HANDLING:
 * - auth/user-not-found: ไม่พบผู้ใช้
 * - auth/wrong-password: รหัสผ่านไม่ถูกต้อง
 * - auth/invalid-email: รูปแบบอีเมลไม่ถูกต้อง
 */
export async function loginUser(data: LoginData): Promise<AuthResult> {
  try {
    console.log("🔐 Auth: Starting user login for:", data.email)

    // STEP 1: ตรวจสอบ credentials กับ Firebase Auth
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, data.email, data.password)

    const user = userCredential.user
    console.log("🔐 Auth: User logged in with UID:", user.uid)

    // STEP 2: อัปเดต lastLogin timestamp
    const userRef = ref(database, `users/${user.uid}/lastLogin`)
    await set(userRef, Date.now())

    console.log("🔐 Auth: Login completed successfully")

    return {
      success: true,
      user: user,
    }
  } catch (error: any) {
    console.error("🔥 Auth: Login error:", error)

    // แปลงข้อผิดพลาดเป็นภาษาไทย
    let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "ไม่พบผู้ใช้งานนี้"
        break
      case "auth/wrong-password":
        errorMessage = "รหัสผ่านไม่ถูกต้อง"
        break
      case "auth/invalid-email":
        errorMessage = "รูปแบบอีเมลไม่ถูกต้อง"
        break
      case "auth/too-many-requests":
        errorMessage = "มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่"
        break
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * ล็อกเอาต์ผู้ใช้
 *
 * PROCESS FLOW:
 * 1. เรียก Firebase signOut()
 * 2. ล้าง Authentication State
 * 3. ส่งคืนผลลัพธ์
 *
 * @returns Promise<AuthResult> - ผลลัพธ์การล็อกเอาต์
 */
export async function logoutUser(): Promise<AuthResult> {
  try {
    console.log("🔐 Auth: Starting user logout")

    await signOut(auth)

    console.log("🔐 Auth: Logout completed successfully")

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("🔥 Auth: Logout error:", error)

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการออกจากระบบ",
    }
  }
}

/**
 * ดึงข้อมูลผู้ใช้จาก Database
 *
 * @param uid - User ID จาก Firebase Auth
 * @returns Promise<any> - ข้อมูลผู้ใช้
 *
 * FIREBASE PATH: /users/{uid}/
 *
 * USED BY:
 * - Dashboard components: แสดงข้อมูลผู้ใช้
 * - Profile components: แก้ไขข้อมูลผู้ใช้
 */
export async function getUserData(uid: string): Promise<any> {
  try {
    console.log("🔐 Auth: Getting user data for UID:", uid)

    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)

    if (snapshot.exists()) {
      const userData = snapshot.val()
      console.log("🔐 Auth: User data retrieved successfully")
      return userData
    } else {
      console.log("🔐 Auth: No user data found")
      return null
    }
  } catch (error) {
    console.error("🔥 Auth: Error getting user data:", error)
    throw error
  }
}

/**
 * ตรวจสอบว่าผู้ใช้เป็น Admin หรือไม่
 *
 * @param uid - User ID จาก Firebase Auth
 * @returns Promise<boolean> - true ถ้าเป็น Admin
 *
 * ADMIN DETECTION:
 * - ตรวจสอบ role field ใน user data
 * - role === 'admin' = Admin User
 * - role === 'user' = Regular User
 */
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const userData = await getUserData(uid)
    return userData?.role === "admin"
  } catch (error) {
    console.error("🔥 Auth: Error checking admin status:", error)
    return false
  }
}

// ✅ เพิ่ม exports ที่หายไปตามที่ร้องขอ
// หมายเหตุ: `useAuthState` ถูก export ไปแล้วในฟังก์ชันด้านบน
// `getUserProfile` ถูกสร้างเป็นชื่อเรียกแทน (alias) ของ `getUserData` เพื่อให้โค้ดทำงานได้
export { getUserData as getUserProfile }
