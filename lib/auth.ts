"use client"

/**
 * Authentication Service - Simplified Version
 * Based on the working version from previous revisions
 */

import { useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth"
import { ref, set, get, query, orderByChild, equalTo } from "firebase/database"
import { auth, database } from "./firebase"

/**
 * Interface สำหรับข้อมูลการลงทะเบียนผู้ใช้
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
 */
export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

/**
 * Interface สำหรับข้อมูลผู้ใช้
 */
export interface UserProfile {
  uid: string
  email: string
  fullName: string
  phone: string
  license: string
  deviceId: string
  role: string
  registeredAt: string
  lastLogin?: number
}

/**
 * Custom React hook for authentication state
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      console.warn("🔧 Firebase auth not available")
      setIsLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser)
        if (currentUser) {
          try {
            const profile = await getUserData(currentUser.uid)
            setUserProfile(profile)
          } catch (err) {
            console.error("Error fetching user profile:", err)
          }
        } else {
          setUserProfile(null)
        }
        setIsLoading(false)
      },
      (err) => {
        console.error("🔥 Auth: onAuthStateChanged error", err)
        setError("เกิดข้อผิดพลาดในการตรวจสอบสถานะผู้ใช้")
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { user, userProfile, isLoading, error }
}

/**
 * ลงทะเบียนผู้ใช้ใหม่ - Simplified Version
 */
export async function registerUser(data: RegisterData): Promise<AuthResult> {
  try {
    console.log("🔐 Auth: Starting user registration for:", data.email)

    if (!auth || !database) {
      throw new Error("Firebase not initialized")
    }

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
      role: "driver",
      registeredAt: new Date().toISOString(),
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
 */
export async function loginUser(data: LoginData): Promise<AuthResult> {
  try {
    console.log("🔐 Auth: Starting user login for:", data.email)

    if (!auth || !database) {
      throw new Error("Firebase not initialized")
    }

    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
    const user = userCredential.user
    console.log("🔐 Auth: User logged in with UID:", user.uid)

    // อั���เดต lastLogin timestamp
    const userRef = ref(database, `users/${user.uid}/lastLogin`)
    await set(userRef, Date.now())

    console.log("🔐 Auth: Login completed successfully")

    return {
      success: true,
      user: user,
    }
  } catch (error: any) {
    console.error("🔥 Auth: Login error:", error)

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
 */
export async function signOut(): Promise<void> {
  try {
    console.log("🔐 Auth: Starting user logout")
    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }
    await firebaseSignOut(auth)
    console.log("🔐 Auth: Logout completed successfully")
  } catch (error: any) {
    console.error("🔥 Auth: Logout error:", error)
    throw new Error("เกิดข้อผิดพลาดในการออกจากระบบ")
  }
}

/**
 * ดึงข้อมูลผู้ใช้จาก Database
 */
export async function getUserData(uid: string): Promise<UserProfile | null> {
  try {
    console.log("🔐 Auth: Getting user data for UID:", uid)

    if (!database) {
      throw new Error("Database not initialized")
    }

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

/**
 * ตรวจสอบอีเมลซ้ำ
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    if (!database) {
      console.warn("🔧 Database not available")
      return false
    }

    console.log("🔍 Validation: Checking email existence:", email)
    const usersRef = ref(database, "users")
    const emailQuery = query(usersRef, orderByChild("email"), equalTo(email))
    const snapshot = await get(emailQuery)

    const exists = snapshot.exists()
    console.log("🔍 Validation: Email exists:", exists)
    return exists
  } catch (error) {
    console.error("🔥 Error checking email:", error)
    return false
  }
}

/**
 * ตรวจสอบใบขับขี่ซ้ำ
 */
export async function checkLicenseExists(license: string): Promise<boolean> {
  try {
    if (!database) {
      console.warn("🔧 Database not available")
      return false
    }

    console.log("🔍 Validation: Checking license existence:", license)
    const usersRef = ref(database, "users")
    const licenseQuery = query(usersRef, orderByChild("license"), equalTo(license))
    const snapshot = await get(licenseQuery)

    const exists = snapshot.exists()
    console.log("🔍 Validation: License exists:", exists)
    return exists
  } catch (error) {
    console.error("🔥 Error checking license:", error)
    return false
  }
}

/**
 * ตรวจสอบอุปกรณ์ซ้ำ
 */
export async function checkDeviceExists(deviceId: string): Promise<boolean> {
  try {
    if (!database) {
      console.warn("🔧 Database not available")
      return false
    }

    console.log("🔍 Validation: Checking device existence:", deviceId)
    const usersRef = ref(database, "users")
    const deviceQuery = query(usersRef, orderByChild("deviceId"), equalTo(deviceId))
    const snapshot = await get(deviceQuery)

    const exists = snapshot.exists()
    console.log("🔍 Validation: Device exists:", exists)
    return exists
  } catch (error) {
    console.error("🔥 Error checking device:", error)
    return false
  }
}

/**
 * ดึงรายการอุปกรณ์ที่ถูกใช้งานแล้ว
 */
export async function getUsedDevices(): Promise<string[]> {
  try {
    if (!database) {
      console.warn("🔧 Database not available")
      return []
    }

    console.log("🔍 Validation: Getting used devices list")
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (snapshot.exists()) {
      const users = snapshot.val()
      const usedDevices = Object.values(users)
        .map((user: any) => user.deviceId)
        .filter((deviceId) => deviceId && deviceId !== "null")

      console.log("🔍 Validation: Used devices:", usedDevices)
      return usedDevices
    }

    return []
  } catch (error) {
    console.error("🔥 Error getting used devices:", error)
    return []
  }
}

// Export aliases for backward compatibility
export const getUserProfile = getUserData
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const response = await fetch("/api/admin/users")
    if (response.ok) {
      return await response.json()
    }
    return []
  } catch (e) {
    console.error("🔥 getAllUsers error:", e)
    return []
  }
}

export const deleteUser = async (uid: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    })

    if (response.ok) {
      return { success: true }
    } else {
      const error = await response.text()
      return { success: false, error }
    }
  } catch (e) {
    console.error("🔥 deleteUser error:", e)
    return { success: false, error: "Network error" }
  }
}
